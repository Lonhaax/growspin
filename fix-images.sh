#!/bin/bash
# Replaces <img src={item.imageUrl} ...> with wsrv.nl wrapper

# Cases page
sed -i '' 's/src={item.imageUrl}/src={item.imageUrl?.startsWith('\''http'\'') ? `https:\/\/wsrv.nl\/?url=${encodeURIComponent(item.imageUrl.replace(\/^\/https?:\\\/\\\/\/g, '\'''\''))}` : item.imageUrl}/g' frontend/src/app/cases/\[id\]/page.tsx

# Admin page
sed -i '' 's/src={item.imageUrl}/src={item.imageUrl?.startsWith('\''http'\'') ? `https:\/\/wsrv.nl\/?url=${encodeURIComponent(item.imageUrl.replace(\/^\/https?:\\\/\\\/\/g, '\'''\''))}` : item.imageUrl}/g' frontend/src/app/admin/page.tsx

# AdvancedCaseCreator
sed -i '' 's/src={item.imageUrl}/src={item.imageUrl?.startsWith('\''http'\'') ? `https:\/\/wsrv.nl\/?url=${encodeURIComponent(item.imageUrl.replace(\/^\/https?:\\\/\\\/\/g, '\'''\''))}` : item.imageUrl}/g' frontend/src/components/admin/AdvancedCaseCreator.tsx

# si.item.imageUrl in AdvancedCaseCreator
sed -i '' 's/src={si.item.imageUrl}/src={si.item.imageUrl?.startsWith('\''http'\'') ? `https:\/\/wsrv.nl\/?url=${encodeURIComponent(si.item.imageUrl.replace(\/^\/https?:\\\/\\\/\/g, '\'''\''))}` : si.item.imageUrl}/g' frontend/src/components/admin/AdvancedCaseCreator.tsx

# ItemManager
sed -i '' 's/src={item.imageUrl}/src={item.imageUrl?.startsWith('\''http'\'') ? `https:\/\/wsrv.nl\/?url=${encodeURIComponent(item.imageUrl.replace(\/^\/https?:\\\/\\\/\/g, '\'''\''))}` : item.imageUrl}/g' frontend/src/components/admin/ItemManager.tsx

