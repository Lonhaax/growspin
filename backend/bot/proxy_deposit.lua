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
            
            -- Fire the webhook
            -- NOTE: Growlauncher's fetch() is basic. If it doesn't support POST, 
            -- you may need to use a GET request or a custom Lua HTTP library.
            local payload = string.format('{"secret":"%s","worldName":"%s","amount":%d,"playerName":"%s"}', SECRET, currentWorld, totalAmount, playerName)
            
            local response = http.post(BACKEND_URL, {
                headers = { ["Content-Type"] = "application/json" },
                body = payload
            })
            
            log("[+] Backend response: " .. tostring(response))
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
            local statusPayload = string.format('{"secret":"%s","worldName":"%s"}', SECRET, currentWorld)
            
            http.post(STATUS_URL, {
                headers = { ["Content-Type"] = "application/json" },
                body = statusPayload
            })
            log("[+] Updated backend with active deposit world: " .. currentWorld)
        end
        sleep(5000)
    end
end)
