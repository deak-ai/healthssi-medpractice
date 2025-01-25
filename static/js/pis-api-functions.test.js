import { describe, it, expect, beforeEach, vi } from 'vitest';
import { initialize_prescription_presentation, parseOpenId4VpUri, byte_array_to_image_url } from './pis-api-functions.mjs';
import fetch from 'node-fetch';

describe('PIS API Functions', () => {
    beforeEach(() => {
        // Reset fetch mock before each test
        global.fetch = vi.fn();
    });

    it('should make a POST request with correct payload and return URI', async () => {
        const mockUri = 'openid4vp://example-uri';
        
        global.fetch.mockResolvedValueOnce({
            ok: true,
            text: async () => mockUri
        });

        const result = await initialize_prescription_presentation();

        expect(result).toBe(mockUri);
        expect(global.fetch).toHaveBeenCalledWith(
            'https://pis.healthwallet.li/vp/request',
            expect.objectContaining({
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'text/plain'
                }
            })
        );
    });

    it('should throw an error when the API call fails', async () => {
        global.fetch.mockRejectedValueOnce(new Error('Network error'));

        await expect(initialize_prescription_presentation())
            .rejects
            .toThrow('Network error');
    });

    it('should throw an error when response is not ok', async () => {
        global.fetch.mockResolvedValueOnce({
            ok: false,
            status: 400,
            text: async () => 'Bad Request'
        });

        await expect(initialize_prescription_presentation())
            .rejects
            .toThrow('HTTP error! status: 400');
    });
});

describe('URI Parser Helper', () => {
    it('should correctly parse and return URI parameters', () => {
        const testUri = 'openid4vp://authorize?response_type=vp_token&client_id=http%3A%2F%2Fhost.docker.internal%3A7003%2Fopenid4vc%2Fverify&response_mode=direct_post&state=RHQj1Xx9QovW&presentation_definition_uri=http%3A%2F%2Fhost.docker.internal%3A7003%2Fopenid4vc%2Fpd%2FRHQj1Xx9QovW&client_id_scheme=redirect_uri&client_metadata=%7B%22authorization_encrypted_response_alg%22%3A%22ECDH-ES%22%2C%22authorization_encrypted_response_enc%22%3A%22A256GCM%22%7D&nonce=42ddc87a-1d53-4f6b-89f2-b93075f13887&response_uri=http%3A%2F%2Fhost.docker.internal%3A7003%2Fopenid4vc%2Fverify%2FRHQj1Xx9QovW';
        
        const params = parseOpenId4VpUri(testUri);
        
        // Test some key parameters
        expect(params.response_type).toBe('vp_token');
        expect(params.response_mode).toBe('direct_post');
        expect(params.state).toBe('RHQj1Xx9QovW');
        expect(params.client_id_scheme).toBe('redirect_uri');
        
        // Test JSON parameter
        expect(params.client_metadata).toEqual({
            authorization_encrypted_response_alg: 'ECDH-ES',
            authorization_encrypted_response_enc: 'A256GCM'
        });
    });

    it('should throw error for invalid URI format', () => {
        const invalidUri = 'openid4vp://authorize'; // No query parameters
        
        expect(() => parseOpenId4VpUri(invalidUri))
            .toThrow('Invalid URI format: no query parameters found');
    });
});

describe('QR Code Functions', () => {
    it('should convert byte array to data URL', () => {
        // Create a simple test byte array (this is not a valid PNG, just for testing the conversion)
        const testBytes = new Uint8Array([137, 80, 78, 71, 13, 10, 26, 10]); // PNG header bytes
        
        const result = byte_array_to_image_url(testBytes);
        
        // Check that we get a properly formatted data URL
        expect(result).toMatch(/^data:image\/png;base64,/);
        // The base64 part should be non-empty
        expect(result.split(',')[1].length).toBeGreaterThan(0);
    });
});
