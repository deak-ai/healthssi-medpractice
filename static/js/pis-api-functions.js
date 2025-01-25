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

// For testing purposes
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        initialize_prescription_presentation,
        parseOpenId4VpUri
    };
}
