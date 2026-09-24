--====================
-- INIT SERVER (MULTI-FILE STRUCTURE)
--====================
local server = HttpServer.new()
print("[SERVER] READY | PORT 80 | DL MODE")

--====================
-- /get_data
--====================
server:get("/get_data", function(req, res)
    res.headers["Access-Control-Allow-Origin"] = "*"
    res.headers["Content-Type"] = "application/json"
    
    local json = _G.json or (pcall(require, "json") and require("json"))
    local PRIVATE_KEY = "f47ac30b58cc4572a567e13b92552332"
    local BOTS_DIR    = "C:\\Users\\Administrator\\Desktop\\httpserver\\bots\\"
    local USER_PATH   = "C:\\Users\\Administrator\\Desktop\\httpserver\\users.json"
    
    local status, result = pcall(function()
        if tostring(req:getParam("key")):gsub("%s+","") ~= PRIVATE_KEY then
            res.status = 403; return json.encode({ error = "Auth Failed" })
        end
        
        local function readJson(path)
            local f = io.open(path, "r")
            if not f then return nil end
            local c = f:read("*all")
            f:close()
            local ok, d = pcall(json.decode, c)
            return ok and d or {}
        end
        
        local combined_data = {}
        local users = readJson(USER_PATH) or {}
        local bots = (type(getBots) == "function") and getBots() or {}
        
        for _, bot in ipairs(bots) do
            local botFilePath = BOTS_DIR .. bot.name .. ".json"
            local botData = readJson(botFilePath)
            
            if botData and botData.active_bot then
                local current_status = tostring(bot.custom_status or "Idle")
                botData.active_bot.status = current_status
                
                if current_status:find("SUCCESS") and botData.completed == false then
                    local uid = current_status:match("SUCCESS:(%d+)") or botData.details.userid or "12345"
                    local amt = tonumber(botData.details.amount) or 0
                    
                    users[uid] = users[uid] or { balance = 0, growid = botData.details.growid }           
                    if botData.details.mode == "withdraw" then
                        users[uid].balance = (users[uid].balance or 0) - amt
                    else
                        users[uid].balance = (users[uid].balance or 0) + amt
                    end      
                    
                    botData.completed = true 
                    local fu = io.open(USER_PATH, "w")
                    if fu then fu:write(json.encode(users)) fu:close() end

                    local fd = io.open(botFilePath, "w")
                    if fd then fd:write(json.encode(botData)) fd:close() end

                elseif current_status:find("EXPIRED") and botData.completed == false then               
                    local fd = io.open(botFilePath, "w")
                    if fd then fd:write(json.encode(botData)) fd:close() end
                end
                
                combined_data[bot.name] = botData
            end
        end
        
        combined_data.user_info = users["12345"] or { balance = 0, growid = "Default" }
        combined_data.server_time = os.time()
        
        return json.encode(combined_data)
    end)
    res:setContent(status and result or '{"error": "Lua Error"}')
end)

--====================
-- /bot/action
--====================
server:get("/bot/action", function(req, res)
    res.headers["Access-Control-Allow-Origin"] = "*"
    local json = _G.json or (pcall(require, "json") and require("json"))
    local PRIVATE_KEY = "f47ac30b58cc4572a567e13b92552332"
    local BOTS_DIR    = "C:\\Users\\Administrator\\Desktop\\httpserver\\bots\\"
    local MINIMUM_DL = 1 -- Write here the minimum addbalanced & withdrawed amount
    
    if tostring(req:getParam("key")):gsub("%s+","") ~= PRIVATE_KEY then
        res.status = 403; return "AUTH FAILED"
    end

    local status, result = pcall(function()
        local req_userid = req:getParam("userid")
        local req_growid = req:getParam("growid")
        local req_amount = tonumber(req:getParam("amount")) or 0
        local bots = (type(getBots) == "function") and getBots() or {} 
        
        if req_amount < MINIMUM_DL then
            return "ERROR: Minimum amount is " .. MINIMUM_DL .. " DLs!"
        end

        for _, bot in ipairs(bots) do
            local f = io.open(BOTS_DIR .. bot.name .. ".json", "r")
            if f then
                local info = json.decode(f:read("*all") or "{}")
                f:close()      
                if info and info.details and info.completed == false then
                    local time_passed = os.time() - (info.details.start_time or 0)
                    if time_passed < 300 then 
                        if info.details.userid == req_userid then
                            return "ERROR: You already have an active session!"
                        end
                        if info.details.growid == req_growid then
                            return "ERROR: This GrowID is currently in a transaction!"
                        end
                    end
                end
            end
        end

        local selected = nil
        local bot_idx = 0   
        for i, b in ipairs(bots) do
            local f_check = io.open(BOTS_DIR .. b.name .. ".json", "r")
            local is_busy = false
            if f_check then
                local d = json.decode(f_check:read("*all") or "{}")
                f_check:close()
                if d and d.completed == false then is_busy = true end
            end
            
            if b:isRunningScript() and b.custom_status == "Waiting User" and not is_busy then
                selected = b
                bot_idx = i
                break
            end
        end

        if not selected then return "No bots available at the moment" end

        -- TRICK PROTECTION
        if req_growid:lower() == selected.name:lower() then
            return "ERROR: You cannot enter the Bot's own name!"
        end

        local Config_Table = { [1] = "DEPO1", [2] = "DEPO2", [3] = "DEPO3" }
        local depo_world = Config_Table[bot_idx] or ("DEPO" .. bot_idx)
        
        local botData = {
            completed = false,
            active_bot = { name = selected.name, status = "Processing..." },
            details = { 
                bot_name = selected.name, depo_world = depo_world, 
                userid = req_userid, growid = req_growid, 
                amount = req_amount, 
                mode = req:getParam("mode"), start_time = os.time() 
            }
        }
        
        local f = io.open(BOTS_DIR .. selected.name .. ".json", "w")
        if f then f:write(json.encode(botData)) f:close() end
        
        return "SUCCESS:" .. selected.name
    end)
    res:setContent(status and result or "Error")
end)

--====================
-- /bot/complete
--====================
server:get("/bot/complete", function(req, res)
    res.headers["Access-Control-Allow-Origin"] = "*"
    local PRIVATE_KEY = "f47ac30b58cc4572a567e13b92552332"
    local BOTS_DIR    = "C:\\Users\\Administrator\\Desktop\\httpserver\\bots\\"
    
    if tostring(req:getParam("key")):gsub("%s+","") ~= PRIVATE_KEY then
        res.status = 403; res:setContent("AUTH FAILED"); return
    end

    local botName = req:getParam("bot_name")
    if botName and botName ~= "" and botName ~= "null" then
        local f_path = BOTS_DIR .. botName .. ".json"
        local removed = os.remove(f_path)
        if not removed then
            local f = io.open(f_path, "w")
            if f then f:write("{}") f:close() end
        end
        print("[SERVER] Cleared session for: " .. botName)
    end
    res:setContent("OK")
end)

server:listen("0.0.0.0", 80)

