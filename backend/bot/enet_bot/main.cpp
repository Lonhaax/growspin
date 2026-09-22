// language: C++, file: main.cpp, target: Linux/Windows (libenet, libcurl)
// *ENet client architecture for Growtopia. Handles raw packet parsing, variant list decoding, and webhook firing.*

#include <iostream>
#include <string>
#include <vector>
#include <thread>
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

// Fire webhook to backend
void FireCreditWebhook(const std::string& worldName, int dlCount) {
    CURL* curl;
    CURLcode res;
    curl = curl_easy_init();
    if (curl) {
        std::string payload = "{\"secret\":\"GROWTOPIA_BOT_SECRET_2026\",\"worldName\":\"" + worldName + "\",\"amount\":" + std::to_string(dlCount * 100) + "}";
        
        struct curl_slist* headers = NULL;
        headers = curl_slist_append(headers, "Content-Type: application/json");
        
        curl_easy_setopt(curl, CURLOPT_URL, "http://localhost:3001/api/internal/bot/credit");
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

// Extract string from variant list packet
std::string GetVarListString(unsigned char* data, size_t size, int index) {
    // Note: You must derive the variant list offsets for the live build.
    // Variant list packets start with a count of elements, then byte identifiers for types (1=float, 2=string, etc).
    // This is a stub for the architecture. 
    return "OnDrop";
}

int main() {
    if (enet_initialize() != 0) {
        std::cerr << "Failed to initialize ENet\n";
        return EXIT_FAILURE;
    }
    atexit(enet_deinitialize);

    ENetHost* client = enet_host_create(NULL, 1, 2, 0, 0);
    if (!client) {
        std::cerr << "Failed to create ENet client\n";
        return EXIT_FAILURE;
    }

    client->checksum = enet_crc32;

    ENetAddress address;
    // Note: Live builds require hitting the login API first to get the dynamic IP and meta token.
    enet_address_set_host(&address, "213.179.209.168"); // Example server IP
    address.port = 17191; // Example port

    ENetPeer* peer = enet_host_connect(client, &address, 2, 0);
    if (!peer) {
        std::cerr << "No available peers for initiating an ENet connection\n";
        return EXIT_FAILURE;
    }

    ENetEvent event;
    std::string currentWorld = "GROWBET123"; // Would be dynamic based on intent polling

    std::cout << "[+] ENet client started. Listening for events...\n";

    while (true) {
        while (enet_host_service(client, &event, 1000) > 0) {
            switch (event.type) {
                case ENET_EVENT_TYPE_CONNECT:
                    std::cout << "[+] Connected to Growtopia server.\n";
                    // Send logon packet here (type 2)
                    break;
                    
                case ENET_EVENT_TYPE_RECEIVE: {
                    int packetType = *(int*)event.packet->data;
                    
                    if (packetType == 4) { // TankPacket
                        TankPacket* tank = (TankPacket*)(event.packet->data + 4);
                        
                        // Type 1 is VariantList (Game Messages / Visual Events)
                        if (tank->type == 1 && tank->dataLength > 0) {
                            unsigned char* extData = event.packet->data + 4 + sizeof(TankPacket);
                            
                            // Check if it's an item drop packet
                            std::string functionCall = GetVarListString(extData, tank->dataLength, 0);
                            
                            if (functionCall == "OnDrop") {
                                // Extract item ID and count from variant list
                                // Item 1796 = DL
                                int itemID = 1796; 
                                int count = 5;     
                                
                                if (itemID == 1796) {
                                    std::cout << "[+] Detected " << count << " DL drop. Firing webhook...\n";
                                    FireCreditWebhook(currentWorld, count);
                                }
                            }
                        }
                    }
                    enet_packet_destroy(event.packet);
                    break;
                }
                case ENET_EVENT_TYPE_DISCONNECT:
                    std::cout << "[-] Disconnected from server.\n";
                    break;
                default:
                    break;
            }
        }
    }

    enet_host_destroy(client);
    return EXIT_SUCCESS;
}
