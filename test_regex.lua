local dialogText = "add_label_with_icon|small|(`w50``) Diamond Lock|left|1796|"
for qty, name in dialogText:gmatch("add_label_with_icon|small|%(`w(%d+)``%) ([^|]+)|") do
    print(qty, name)
end
