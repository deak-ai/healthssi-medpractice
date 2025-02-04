import { describe, it, expect } from 'vitest';
import { processSmartHealthCardCredentials } from './fhirSmartHealthCardProcessor.js';
import fs from 'fs';
import path from 'path';

describe('FHIR SmartHealthCard Processor Integration Tests', () => {
    it('should process a real Smart Health Card from JSON file', async () => {
        // Read the sample Smart Health Card from the design directory
        const jsonPath = path.join(process.cwd(), 'design', 'smart_health_card_fhir.json');
        const rawData = fs.readFileSync(jsonPath, 'utf8');
        const smartHealthCardCredentials = JSON.parse(rawData);

        // Process the credentials
        const processedResources = processSmartHealthCardCredentials(smartHealthCardCredentials);

        // Log the processed resources for inspection
        console.log('Processed Resources:', JSON.stringify(processedResources, null, 2));

        // Verify the structure of processed resources
        expect(processedResources).toBeDefined();
        expect(typeof processedResources).toBe('object');

        // The processor should have these specific arrays
        expect(processedResources).toHaveProperty('patient');
        expect(processedResources).toHaveProperty('allergies');
        expect(processedResources).toHaveProperty('medications');
        expect(processedResources).toHaveProperty('conditions');
        expect(processedResources).toHaveProperty('immunizations');
        expect(processedResources).toHaveProperty('procedures');
        expect(processedResources).toHaveProperty('other');

        // Arrays should be initialized
        expect(Array.isArray(processedResources.allergies)).toBe(true);
        expect(Array.isArray(processedResources.medications)).toBe(true);
        expect(Array.isArray(processedResources.conditions)).toBe(true);
        expect(Array.isArray(processedResources.immunizations)).toBe(true);
        expect(Array.isArray(processedResources.procedures)).toBe(true);
        expect(Array.isArray(processedResources.other)).toBe(true);

        // Patient is special as it's a single object, not an array
        if (processedResources.patient) {
            expect(processedResources.patient).toHaveProperty('uri');
            expect(processedResources.patient).toHaveProperty('resourceType', 'Patient');
            expect(processedResources.patient).toHaveProperty('name', 'Adah626 Altenwerth646');
            expect(processedResources.patient).toHaveProperty('birthDate', '1951-09-30');
            expect(processedResources.patient).toHaveProperty('gender', 'female');
            expect(processedResources.patient).toHaveProperty('address', '705 Hirthe Common');
            expect(processedResources.patient).toHaveProperty('city', 'Bellingham');
            expect(processedResources.patient).toHaveProperty('country', 'US');
        }

        // Verify allergies array has the expected content
        expect(processedResources.allergies).toHaveLength(2);
        const allergy = processedResources.allergies[0];
        expect(allergy).toHaveProperty('resourceType', 'AllergyIntolerance');
        expect(allergy).toHaveProperty('name', 'Allergy to grass pollen');
        expect(allergy).toHaveProperty('code', '418689008');
        expect(allergy).toHaveProperty('criticality', 'low');
        expect(allergy).toHaveProperty('clinicalStatus', 'active');
    });
});
