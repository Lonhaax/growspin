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

-- Dump Global Environment (_G) to find the correct API

log("=========================================")
log("DUMPING POWERKUY LUA API")
log("=========================================")

local count = 0
for k, v in pairs(_G) do
    if type(v) == "function" or type(v) == "table" then
        log("API Member: " .. tostring(k) .. " (" .. type(v) .. ")")
        count = count + 1
    end
end

log("=========================================")
log("Total API Members Found: " .. tostring(count))
log("=========================================")

-- Keep the script alive just in case
addHook(function() end, "onDraw")
log("[+] API Dumper loaded. Check console for available functions.")
