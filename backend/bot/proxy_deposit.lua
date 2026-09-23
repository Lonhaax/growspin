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

addHook(DepositHandler, "onVariant")
log("[+] Growlauncher Deposit Script loaded. Listening for drops...")

runThread(function()
    local STATUS_URL = BACKEND_URL:gsub("/credit", "/status")
    local lastWorld = ""
    while true do
        local currentWorld = GetWorldName()
        if currentWorld and currentWorld ~= "" and currentWorld ~= lastWorld then
            lastWorld = currentWorld
            
            local url = string.format("%s?secret=%s&worldName=%s",
                STATUS_URL, SECRET, urlencode(currentWorld))
            
            local res, err = fetch(url)
            log("[+] Updated backend with active deposit world: " .. currentWorld)
        end
        sleep(5000)
    end
end)
