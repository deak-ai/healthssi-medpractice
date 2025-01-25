const { initialize_prescription_presentation, parseOpenId4VpUri, generate_qr_code, byte_array_to_image_url, subscribe_to_notifications } = require('./pis-api-functions');
const fetch = require('node-fetch');
const fs = require('fs');
const path = require('path');
const WebSocket = require('ws');

describe('PIS API Integration Tests', () => {
     it.skip('should successfully make a real API call to PIS service', async () => {
        try {
            const result = await initialize_prescription_presentation();
            
            // Parse and log the URI parameters
            const params = parseOpenId4VpUri(result);
            
            console.log(params)
            // The result should be a string containing a URI
            expect(typeof result).toBe('string');
            expect(result).toMatch(/^openid4vp:\/\/authorize\?/); // Should start with openid4vp://authorize?
            
            // Additional checks on the parsed parameters
            expect(params.response_type).toBe('vp_token');
            expect(params.response_mode).toBe('direct_post');
            expect(typeof params.state).toBe('string');
            expect(typeof params.nonce).toBe('string');
        } catch (error) {
            console.error('Integration test failed:', {
                name: error.name,
                message: error.message,
                stack: error.stack
            });
            throw error;
        }
     }, 10000);

    it.skip('should generate a QR code and demonstrate both file saving and data URL conversion', async () => {
        const testString = 'https://example.com/test';
        const outputPath = path.join(__dirname, '../../design/test-qr-code.png');

        try {
            // Generate QR code bytes
            const qrBytes = await generate_qr_code(testString);
            
            // Verify we got a Uint8Array with some content
            expect(qrBytes).toBeInstanceOf(Uint8Array);
            expect(qrBytes.length).toBeGreaterThan(0);

            // Method 1: Direct file saving of PNG bytes
            fs.writeFileSync(outputPath, Buffer.from(qrBytes));
            
            // Verify the file was created and has content
            const fileStats = fs.statSync(outputPath);
            expect(fileStats.size).toBeGreaterThan(0);
            
            // Method 2: Convert to data URL (for browser usage)
            const dataUrl = byte_array_to_image_url(qrBytes);
            expect(dataUrl).toMatch(/^data:image\/png;base64,/);
            
            // Optional: Save the base64 part to a separate file for verification
            const base64Data = dataUrl.replace(/^data:image\/png;base64,/, '');
            fs.writeFileSync(
                path.join(__dirname, '../../design/test-qr-code-from-base64.png'),
                Buffer.from(base64Data, 'base64')
            );

            console.log(`QR code saved to: ${outputPath}`);
            console.log('Data URL length:', dataUrl.length);
        } catch (error) {
            console.error('Failed to generate or save QR code:', error);
            throw error;
        }
    }, 10000);

    it('should connect to WebSocket and receive messages', (done) => {
        // First get a valid state ID by making a prescription presentation request
        initialize_prescription_presentation()
            .then(result => {
                const params = parseOpenId4VpUri(result);
                const stateId = params.state;
                expect(stateId).toBeTruthy();
                console.log(result)
                // Set up message handler
                const messageHandler = (data) => {
                    try {
                        console.log('Received WebSocket message:', data);
                        // Verify the message structure
                        expect(data).toBeDefined();
                        // You might want to add more specific checks based on your expected message format
                        
                        // Close the connection after receiving a message
                        ws.close();
                        done();
                    } catch (error) {
                        done(error);
                    }
                };

                // Create WebSocket connection
                const ws = subscribe_to_notifications(stateId, messageHandler, WebSocket);
                
                // Set a timeout in case we don't receive a message
                setTimeout(() => {
                    ws.close();
                    done(new Error('Timeout waiting for WebSocket message'));
                }, 600000);
            })
            .catch(error => {
                console.error('Failed to initialize WebSocket test:', error);
                done(error);
            });
    }, 600000);
});
