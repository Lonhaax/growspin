-- language: Lua, file: proxy_deposit.lua
-- *Deposit script for PowerKuy Android*

local BACKEND_URL = "https://api.growspin.lol/api/internal/bot/credit"
local SECRET = "GROWTOPIA_BOT_SECRET_2026"

local TARGET_ITEMS = {
    [242] = 1,
    [1796] = 100,
    [7188] = 10000
}

local function urlencode(str)
    if str then
        str = string.gsub(str, "([^%w _%%%-%.~])", function(c) return string.format("%%%02X", string.byte(c)) end)
        str = string.gsub(str, " ", "%%20")
    end
    return str
end

-- PowerKuy Android uses AddHook("EventName", "UniqueId", function)
-- Variants are zero-indexed tables: varlist[0], varlist[1]
AddHook("OnVariant", "deposit_variant_hook", function(varlist)
    if not varlist or not varlist[0] then return end
    
    local v0 = tostring(varlist[0])
    
    -- Exclude movement and spam to keep console clean
    if v0 ~= "OnConsoleMessage" and v0 ~= "OnTalkBubble" and v0 ~= "OnSetBux" then
        LogToConsole("DEBUG VAR: " .. v0)
        if varlist[1] then LogToConsole("  [1]=" .. tostring(varlist[1])) end
        if varlist[2] then LogToConsole("  [2]=" .. tostring(varlist[2])) end
    end
    
    -- If we get console messages, check for drops or trades
    if v0 == "OnConsoleMessage" then
        local msg = tostring(varlist[1]):lower()
        if msg:find("drop") or msg:find("trade") then
            LogToConsole("DEBUG CHAT: " .. tostring(varlist[1]))
        end
    end
end)

LogToConsole("[+] PowerKuy Android Script Loaded. Hook syntax fixed.")
