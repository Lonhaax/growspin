// language: C++, file: main.cpp, target: Linux/Windows (libenet, libcurl)
// *ENet client architecture for Growtopia. Handles raw packet parsing, variant list decoding, and webhook firing.*

#include <iostream>
#include <string>
#include <vector>
#include <thread>
#include <map>
#include <cstring>
#include <enet/enet.h>
#include <curl/curl.h>

#pragma pack(push, 1)
struct TankPacket {
    int type;
    int netID;
    int secondaryNetID;
    int characterState;
    float padding;
    int value;
    float x;
    float y;
    float xSpeed;
    float ySpeed;
    int padding2;
    int punchX;
    int punchY;
    int dataLength;
};
#pragma pack(pop)

// Utility function to fire the webhook
void FireCreditWebhook(const std::string& worldName, int dlCount) {
    CURL* curl;
    CURLcode res;
    curl = curl_easy_init();
    if (curl) {
        std::string payload = "{\"secret\":\"GROWTOPIA_BOT_SECRET_2026\",\"worldName\":\"" + worldName + "\",\"amount\":" + std::to_string(dlCount * 100) + "}";
        
        struct curl_slist* headers = NULL;
        headers = curl_slist_append(headers, "Content-Type: application/json");
        
        curl_easy_setopt(curl, CURLOPT_URL, "http://backend:3001/api/internal/bot/credit");
        curl_easy_setopt(curl, CURLOPT_HTTPHEADER, headers);
        curl_easy_setopt(curl, CURLOPT_POSTFIELDS, payload.c_str());
        
        res = curl_easy_perform(curl);
        if (res != CURLE_OK)
            std::cerr << "[!] Webhook failed: " << curl_easy_strerror(res) << "\n";
        else
            std::cout << "[+] Webhook fired successfully for " << dlCount << " DLs in " << worldName << "\n";
            
        curl_slist_free_all(headers);
        curl_easy_cleanup(curl);
    }
}

struct MemoryStruct {
    char *memory;
    size_t size;
};

static size_t WriteMemoryCallback(void *contents, size_t size, size_t nmemb, void *userp) {
    size_t realsize = size * nmemb;
    struct MemoryStruct *mem = (struct MemoryStruct *)userp;
    char *ptr = (char*)realloc(mem->memory, mem->size + realsize + 1);
    if (!ptr) return 0;
    mem->memory = ptr;
    memcpy(&(mem->memory[mem->size]), contents, realsize);
    mem->size += realsize;
    mem->memory[mem->size] = 0;
    return realsize;
}

std::map<std::string, std::string> GetServerData() {
    std::map<std::string, std::string> serverData;
    CURL *curl_handle;
    CURLcode res;
    struct MemoryStruct chunk;
    chunk.memory = (char*)malloc(1);
    chunk.size = 0;
    curl_global_init(CURL_GLOBAL_ALL);
    curl_handle = curl_easy_init();
    std::string postData = "version=4.62&platform=0&protocol=208"; 
    
    curl_easy_setopt(curl_handle, CURLOPT_URL, "https://www.growtopia1.com/growtopia/server_data.php");
    curl_easy_setopt(curl_handle, CURLOPT_POSTFIELDS, postData.c_str());
    curl_easy_setopt(curl_handle, CURLOPT_WRITEFUNCTION, WriteMemoryCallback);
    curl_easy_setopt(curl_handle, CURLOPT_WRITEDATA, (void *)&chunk);
    curl_easy_setopt(curl_handle, CURLOPT_USERAGENT, "UbiServices_SDK_2022.Release.9_PC64_unicode_static");

    res = curl_easy_perform(curl_handle);

    if (res == CURLE_OK) {
        std::string response(chunk.memory);
        size_t pos = 0;
        std::string token;
        while ((pos = response.find('\n')) != std::string::npos) {
            token = response.substr(0, pos);
            size_t delim = token.find('|');
            if (delim != std::string::npos) {
                serverData[token.substr(0, delim)] = token.substr(delim + 1);
            }
            response.erase(0, pos + 1);
        }
    }
    curl_easy_cleanup(curl_handle);
    free(chunk.memory);
    curl_global_cleanup();
    return serverData;
}

std::string BuildLogonPacket(const std::string& meta) {
    std::string packet = "action|logon\n";
    packet += "requestedName|GrowSpinBot\n";
    packet += "tankIDName|GrowSpinBot\n";
    packet += "tankIDPass|growspinpass\n";
    packet += "f|1\n";
    packet += "protocol|208\n";
    packet += "game_version|4.62\n";
    packet += "fz|54316160\n";
    packet += "lmode|0\n";
    packet += "cbits|0\n";
    packet += "player_age|25\n";
    packet += "GDPR|1\n";
    packet += "hash2|641177651\n";
    packet += "meta|" + meta + "\n";
    packet += "fhash|-716973604\n";
    packet += "platformID|0\n";
    packet += "deviceVersion|0\n";
    packet += "country|us\n";
    packet += "hash|47366115\n";
    packet += "mac|00:00:00:00:00:00\n";
    return packet;
}

ENetPacket* CreatePacket(int type, const std::string& text) {
    ENetPacket* packet = enet_packet_create(NULL, text.length() + 5, ENET_PACKET_FLAG_RELIABLE);
    *(int*)packet->data = type;
    memcpy(packet->data + 4, text.c_str(), text.length());
    packet->data[packet->dataLength - 1] = 0;
    return packet;
}

std::string GetVarListString(unsigned char* data, size_t size, int index) {
    if (size < 1) return "";
    int numElements = data[0];
    if (index >= numElements) return "";
    int offset = 1;
    for (int i = 0; i <= index; ++i) {
        if (offset >= size) return "";
        int type = data[offset++];
        if (type == 1) offset += 4;
        else if (type == 2) {
            int strLen = *(int*)(data + offset);
            offset += 4;
            if (i == index) return std::string((char*)(data + offset), strLen);
            offset += strLen;
        }
        else if (type == 5 || type == 9) offset += 4;
    }
    return "";
}

int GetVarListInt(unsigned char* data, size_t size, int index) {
    if (size < 1) return 0;
    int numElements = data[0];
    if (index >= numElements) return 0;
    int offset = 1;
    for (int i = 0; i <= index; ++i) {
        if (offset >= size) return 0;
        int type = data[offset++];
        if (type == 1) offset += 4;
        else if (type == 2) {
            int strLen = *(int*)(data + offset);
            offset += 4;
            offset += strLen;
        }
        else if (type == 5 || type == 9) {
            if (i == index) return *(int*)(data + offset);
            offset += 4;
        }
    }
    return 0;
}

int main() {
    auto serverData = GetServerData();
    if (serverData.find("server") == serverData.end()) {
        std::cerr << "[-] Failed to fetch server data.\n";
        return EXIT_FAILURE;
    }

    std::string ip = serverData["server"];
    int port = std::stoi(serverData["port"]);
    std::string meta = serverData["meta"];
    
    std::cout << "[+] Target IP: " << ip << ":" << port << " | Meta: " << meta.substr(0, 5) << "...\n";

    if (enet_initialize() != 0) return EXIT_FAILURE;
    atexit(enet_deinitialize);

    ENetHost* client = enet_host_create(NULL, 1, 2, 0, 0);
    client->usingNewPacket = true;
    client->checksum = enet_crc32;
    enet_host_compress_with_range_coder(client);

    ENetAddress address;
    enet_address_set_host(&address, ip.c_str());
    address.port = port;

    ENetPeer* peer = enet_host_connect(client, &address, 2, 0);

    ENetEvent event;
    std::string currentWorld = "GROWBET123";

    while (true) {
        while (enet_host_service(client, &event, 5) > 0) {
            if (event.type == ENET_EVENT_TYPE_CONNECT) {
                std::cout << "[+] Connected. Sending logon...\n";
                ENetPacket* logonPacket = CreatePacket(2, BuildLogonPacket(meta));
                enet_peer_send(peer, 0, logonPacket);
            }
            else if (event.type == ENET_EVENT_TYPE_RECEIVE) {
                int packetType = *(int*)event.packet->data;
                if (packetType == 3) {
                    std::string msg((char*)event.packet->data + 4, event.packet->dataLength - 4);
                    if (msg.find("action|logon_fail") != std::string::npos) {
                        std::cout << "[-] Logon Failed! Hash/Version outdated.\n";
                    }
                }
                if (packetType == 4) {
                    TankPacket* tank = (TankPacket*)(event.packet->data + 4);
                    if (tank->type == 1 && tank->dataLength > 0) {
                        unsigned char* extData = event.packet->data + 4 + sizeof(TankPacket);
                        std::string functionCall = GetVarListString(extData, tank->dataLength, 0);
                        if (functionCall == "OnDrop") {
                            int itemID = GetVarListInt(extData, tank->dataLength, 1);
                            int count = GetVarListInt(extData, tank->dataLength, 3);
                            if (itemID == 1796) FireCreditWebhook(currentWorld, count);
                        }
                    }
                }
                enet_packet_destroy(event.packet);
            }
            else if (event.type == ENET_EVENT_TYPE_DISCONNECT) {
                std::cout << "[-] Disconnected.\n";
            }
        }
    }
    enet_host_destroy(client);
    return EXIT_SUCCESS;
}
