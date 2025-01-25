const { initialize_prescription_presentation, parseOpenId4VpUri } = require('./pis-api-functions');
const fetch = require('node-fetch');

describe('PIS API Integration Tests', () => {
    // Set up node-fetch as the global fetch
    // beforeAll(() => {
    //     if (!globalThis.fetch) {
    //         globalThis.fetch = fetch;
    //     }
    // });

    it('should successfully make a real API call to PIS service', async () => {
        // If we get here, the server is accessible, proceed with the actual test
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
    }, 10000); // Increasing timeout to 10s for real API call
});
