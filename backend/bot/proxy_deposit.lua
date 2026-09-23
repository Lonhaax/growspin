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

-- Cleaned up basic hooks to prevent engine crash
addHook(DepositHandler, "onVariant")

addHook(function(type, packet)
    -- Log all incoming variant list packets
    if type == 1 then
        log("DEBUG Type 1 (Variant List)")
    end
    -- Log all text packets
    if type == 2 or type == 3 then
        if packet and string.find(string.lower(packet), "drop") then
            log("DEBUG Text Packet with 'drop': " .. tostring(packet))
        end
    end
end, "onPacket")

addHook(function(type, packet)
    if type == 2 or type == 3 then
        if packet and string.find(string.lower(packet), "drop") then
            log("DEBUG Outgoing Text Packet with 'drop': " .. tostring(packet))
        end
    end
end, "onSendPacket")

log("[+] Growlauncher Deposit Script loaded. Listening for drops...")

local lastWorldUpdate = 0
local lastWorld = ""

addHook(function()
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
                
                local res, err = fetch(url)
                log("[+] Updated backend with active deposit world: " .. currentWorld)
            end)
        end
    end
end, "onDraw")
