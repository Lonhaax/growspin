-- language: Lua, file: proxy_deposit.lua
-- *Deposit script for PowerKuy / EnetProxy on Windows VPS*
-- *Listens for Diamond Lock drops and fires HTTP requests to the backend.*

BACKEND_URL = "https://api.growspin.lol/api/internal/bot/credit"
SECRET = "GROWTOPIA_BOT_SECRET_2026"
TARGET_ITEMS = {
    [242] = 1,      -- World Lock = 1 WL
    [1796] = 100,   -- Diamond Lock = 100 WLs
    [7188] = 10000  -- Blue Gem Lock = 100 DLs (10000 WLs)
}

local function urlencode(str)
    if str then
        str = string.gsub(str, "([^%w _%%%-%.~])", function(c) return string.format("%%%02X", string.byte(c)) end)
        str = string.gsub(str, " ", "%%20")
    end
    return str
end

-- This is a generic hook architecture. Adjust the callback name (e.g., OnVariant, OnPacket)
-- based on the exact proxy software you are using on your VPS.

function DepositHandler(var, pkt)
    -- DEBUG: Print every variant (excluding chat/console spam) to see the exact OnDrop structure
    if var.v1 and var.v1 ~= "OnConsoleMessage" and var.v1 ~= "OnTalkBubble" and var.v1 ~= "OnSetBux" then
        log("DEBUG Variant: v1=" .. tostring(var.v1) .. " | v2=" .. tostring(var.v2) .. " | v3=" .. tostring(var.v3) .. " | v4=" .. tostring(var.v4))
    end
    
    -- If it's a console message, check if it mentions a drop
    if var.v1 == "OnConsoleMessage" and var.v2:lower():find("drop") then
        log("DEBUG Console Drop Msg: " .. tostring(var.v2))
    end

    if var.v1 == "OnDrop" then
        -- Example structure for OnDrop:
        -- var.v2 = NetID (who dropped it)
        -- var.v3 = ItemID
        -- var.v4 = Count (depending on exact variant structure, might be v4 or v3)
        
        local itemID = tonumber(var.v3)
        local count = tonumber(var.v4) -- adjust index if needed
        local netID = tonumber(var.v2)
        
        local multiplier = TARGET_ITEMS[itemID]
        
        if multiplier then
            local currentWorld = GetWorldName()
            if currentWorld == "" then currentWorld = "UNKNOWN" end

            local playerName = "UNKNOWN"
            local p = getPlayerByNetID(netID)
            if p then playerName = p.name end

            local totalAmount = count * multiplier
            log(string.format("[+] Detected drop of %d items (ID %d) in %s by %s | Value: %d", count, itemID, currentWorld, playerName, totalAmount))
            
            -- Fire the webhook in a thread so it doesn't block the game loop
            runThread(function()
                local url = string.format("%s?secret=%s&worldName=%s&amount=%d&playerName=%s",
                    BACKEND_URL, SECRET, urlencode(currentWorld), totalAmount, urlencode(playerName))
                
                local res, err = fetch(url)
                
                if err then
                    log("[-] Backend error: " .. tostring(err))
                else
                    log("[+] Backend response: " .. tostring(res))
                end
            end)
        end
    end
end

local lastObjects = {}

-- Helper to check if an object is newly dropped
local function detectNewDrops()
    -- This relies on GetObjects() being supported by the proxy
    if type(GetObjects) ~= "function" then return end
    
    local success, currentObjects = pcall(GetObjects)
    if not success or type(currentObjects) ~= "table" then return end
    
    local currentObjMap = {}
    
    for _, obj in pairs(currentObjects) do
        -- Typically obj has .id (object id in world) and .itemID
        -- Growlauncher uses .id for unique instance ID, .itemid for the type
        local objId = obj.id or obj.uid or obj.oid
        if objId then
            currentObjMap[objId] = obj
            
            -- If we haven't seen this specific object ID before, it's a new drop!
            if not lastObjects[objId] then
                local itemID = obj.itemid or obj.itemID or obj.id
                local count = obj.count or obj.amount or 1
                
                local multiplier = TARGET_ITEMS[itemID]
                if multiplier then
                    local totalAmount = count * multiplier
                    
                    -- We don't know who dropped it purely from GetObjects, so we credit the nearest player
                    local dropper = "UNKNOWN"
                    if type(GetPlayers) == "function" then
                        local pcallSuccess, players = pcall(GetPlayers)
                        if pcallSuccess and type(players) == "table" then
                            local minDist = 999999
                            for _, p in pairs(players) do
                                if p.name and p.x and p.y and obj.x and obj.y then
                                    local dist = (p.x - obj.x)^2 + (p.y - obj.y)^2
                                    if dist < minDist then
                                        minDist = dist
                                        dropper = p.name
                                    end
                                end
                            end
                        end
                    end
                    
                    local currentWorld = GetWorldName()
                    if currentWorld == "" then currentWorld = "UNKNOWN" end
                    
                    log(string.format("[+] POLLER: Detected drop of %d items (ID %d) near %s | Value: %d", count, itemID, dropper, totalAmount))
                    
                    runThread(function()
                        local url = string.format("%s?secret=%s&worldName=%s&amount=%d&playerName=%s",
                            BACKEND_URL, SECRET, urlencode(currentWorld), totalAmount, urlencode(dropper))
                        local res, err = fetch(url)
                        if err then log("[-] Backend error: " .. tostring(err)) else log("[+] Backend response: " .. tostring(res)) end
                    end)
                end
            end
        end
    end
    
    lastObjects = currentObjMap
end

local lastWorldUpdate = 0
local lastWorld = ""

addHook(function()
    detectNewDrops()
    
    local now = os.time()
    if now - lastWorldUpdate >= 5 then
        lastWorldUpdate = now
        local currentWorld = GetWorldName()
        if currentWorld and currentWorld ~= "" and currentWorld ~= lastWorld then
            lastWorld = currentWorld
            
            runThread(function()
                local STATUS_URL = BACKEND_URL:gsub("/credit", "/status")
                local url = string.format("%s?secret=%s&worldName=%s",
                    STATUS_URL, SECRET, urlencode(currentWorld))
                fetch(url)
                log("[+] Updated backend with active deposit world: " .. currentWorld)
            end)
        end
    end
end, "onDraw")

log("[+] Growlauncher State-Poller Deposit Script loaded. Polling for drops...")
