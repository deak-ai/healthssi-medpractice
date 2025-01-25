/**
 * Functions for interacting with the PIS API service
 */

/**
 * Initializes a prescription presentation request by calling the PIS API.
 * @returns {Promise<string>} A promise that resolves to the authorization URI
 * @throws {Error} If the API call fails
 */
async function initialize_prescription_presentation() {
    const requestPayload = {
        authorizeBaseUrl: "openid4vp://authorize",
        responseMode: "direct_post",
        successRedirectUri: null,
        errorRedirectUri: null,
        statusCallbackUri: "https://pis.healthwallet.li/vp/status",
        presentationDefinition: {
            request_credentials: [
                {
                    format: "jwt_vc_json",
                    type: "SwissMedicalPrescription"
                }
            ]
        }
    };

    try {
        console.log('Making request to PIS API...');
        
        // Configure node-fetch for testing environment
        const fetchOptions = {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Accept': 'text/plain'
            },
            body: JSON.stringify(requestPayload)
        };

        // Make the request
        const response = await fetch('https://pis.healthwallet.li/vp/request', fetchOptions);

        if (!response) {
            throw new Error('No response received from the server');
        }

        console.log('Response status:', response.status);
        
        // Get response text before checking status to include it in error message
        const responseText = await response.text();
        console.log('Response text:', responseText);

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}, message: ${responseText}`);
        }

        if (!responseText) {
            throw new Error('Response did not contain a URI');
        }

        return responseText.trim();
    } catch (error) {
        console.error('Error initializing prescription presentation:', {
            name: error.name,
            message: error.message,
            stack: error.stack
        });
        throw error;
    }
}

/**
 * Helper function to parse and log URI parameters from an openid4vp URI
 * @param {string} uri - The URI string to parse
 * @returns {Object} Object containing the parsed parameters
 */
function parseOpenId4VpUri(uri) {
    try {
        // Extract the query string part (everything after the ?)
        const [baseUrl, queryString] = uri.split('?');
        
        if (!queryString) {
            throw new Error('Invalid URI format: no query parameters found');
        }
        
        // Split into key-value pairs and decode
        const params = {};
        queryString.split('&').forEach(pair => {
            const [key, value] = pair.split('=');
            const decodedValue = decodeURIComponent(value);
            
            // Try to parse JSON if the value looks like a JSON string
            let parsedValue = decodedValue;
            if (decodedValue.startsWith('{') && decodedValue.endsWith('}')) {
                try {
                    parsedValue = JSON.parse(decodedValue);
                } catch (e) {
                    // If JSON parsing fails, keep the original decoded value
                }
            }
            
            params[key] = parsedValue;
            
        });

        return params;
    } catch (error) {
        console.error('Error parsing URI:', error.message);
        throw error;
    }
}

/**
 * Generate a QR code from a string using the PIS API
 * @param {string} text - The text to encode in the QR code
 * @returns {Promise<Uint8Array>} A promise that resolves to the QR code as a byte array
 * @throws {Error} If the API call fails
 */
async function generate_qr_code(text) {
    try {
        const response = await fetch('https://pis.healthwallet.li/utils/qrcode', {
            method: 'POST',
            headers: {
                'Content-Type': 'text/plain'
            },
            body: text
        });

        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`HTTP error! status: ${response.status}, message: ${errorText}`);
        }

        // Get the raw bytes from the response
        const buffer = await response.arrayBuffer();
        return new Uint8Array(buffer);
    } catch (error) {
        console.error('Error generating QR code:', error);
        throw error;
    }
}

/**
 * Convert a byte array (Uint8Array) to a data URL that can be used as an image source
 * @param {Uint8Array} byteArray - The byte array containing the PNG data
 * @returns {string} A data URL that can be used in an <img> tag's src attribute
 */
function byte_array_to_image_url(byteArray) {
    // Convert the Uint8Array to a base64 string
    let binary = '';
    const bytes = new Uint8Array(byteArray);
    bytes.forEach(byte => binary += String.fromCharCode(byte));
    const base64 = btoa(binary);
    
    // Create a data URL with the PNG MIME type
    return `data:image/png;base64,${base64}`;
}

/**
 * Subscribe to WebSocket notifications for a specific state ID
 * @param {string} stateId - The state ID to subscribe to
 * @param {function(Object)} onMessage - Callback function that will be called with parsed JSON messages
 * @param {WebSocket} [WebSocketClass] - Optional WebSocket class (for Node.js environment)
 * @returns {WebSocket} The WebSocket instance for further handling if needed
 * @throws {Error} If WebSocket connection fails or if stateId is invalid
 */
function subscribe_to_notifications(stateId, onMessage, WebSocketClass) {
    if (!stateId) {
        throw new Error('stateId is required');
    }

    // Construct the WebSocket URL
    const wsUrl = `wss://pis.healthwallet.li/notifications/${stateId}`;
    
    // Use provided WebSocket class (Node.js) or browser's WebSocket
    const WS = WebSocketClass || (typeof WebSocket !== 'undefined' ? WebSocket : null);
    if (!WS) {
        throw new Error('WebSocket is not available in this environment');
    }

    // Create WebSocket instance
    const ws = new WS(wsUrl);

    // Set up event handlers
    ws.addEventListener('open', () => {
        console.log(`WebSocket connected to ${wsUrl}`);
    });

    ws.addEventListener('message', (event) => {
        try {
            // Parse the JSON message
            const jsonData = JSON.parse(event.data);
            // Call the callback with the parsed data
            onMessage(jsonData);
        } catch (error) {
            console.error('Error parsing WebSocket message:', error);
            console.log('Raw message:', event.data);
        }
    });

    ws.addEventListener('error', (error) => {
        console.error('WebSocket error:', error);
    });

    ws.addEventListener('close', (event) => {
        console.log(`WebSocket closed with code ${event.code}${event.reason ? `: ${event.reason}` : ''}`);
    });

    return ws;
}

// Export the functions
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        initialize_prescription_presentation,
        parseOpenId4VpUri,
        generate_qr_code,
        byte_array_to_image_url,
        subscribe_to_notifications
    };
}
