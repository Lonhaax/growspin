-- language: Lua, file: proxy_deposit.lua
-- *Deposit script for PowerKuy / EnetProxy on Windows VPS*
-- *Listens for Diamond Lock drops and fires HTTP requests to the backend.*

local BACKEND_URL = "https://api.growspin.lol/api/internal/bot/credit"
local SECRET = "GROWTOPIA_BOT_SECRET_2026"
local TARGET_ITEM_ID = 1796 -- Diamond Lock

-- This is a generic hook architecture. Adjust the callback name (e.g., OnVariant, OnPacket)
-- based on the exact proxy software you are using on your VPS.

function OnVariantList(varlist)
    -- varlist[0] is typically the function call string
    if varlist[0] == "OnDrop" then
        -- Example structure for OnDrop:
        -- varlist[1] = NetID (who dropped it)
        -- varlist[2] = ItemID
        -- varlist[3] = Count
        
        local itemID = tonumber(varlist[2])
        local count = tonumber(varlist[3])
        
        if itemID == TARGET_ITEM_ID then
            local currentWorld = GetWorldName() -- Proxy-specific function to get world
            if currentWorld == "" then currentWorld = "UNKNOWN" end

            print("[+] Detected drop of " .. count .. " DLs in " .. currentWorld)
            
            -- Fire the webhook
            local payload = string.format('{"secret":"%s","worldName":"%s","amount":%d}', SECRET, currentWorld, count * 100)
            
            -- Using a generic HTTP post function. 
            -- Your proxy may use http.post(), request(), or require a specific HTTP library.
            local response = http.post(BACKEND_URL, {
                headers = { ["Content-Type"] = "application/json" },
                body = payload
            })
            
            print("[+] Backend response: " .. tostring(response))
        end
    end
end

-- Hook the variant list packet from the server (Type 1)
AddHook("on_variant_list", "DepositHandler", OnVariantList)

print("[+] Proxy Deposit Script loaded. Listening for DL drops...")
