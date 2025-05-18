import axios from 'axios';
import * as xsenv from '@sap/xsenv';

interface XsuaaCredentials {
    url: string;
    clientid: string;
    clientsecret: string;
}

/**
 * Dynamisch ophalen van XSUAA-credentials bij elke aanvraag.
 */
function getXsuaaCredentials(): XsuaaCredentials | null {
    try {
        const VCAP_SERVICES = xsenv.getServices<{ xsuaa: XsuaaCredentials }>({ xsuaa: { tag: 'xsuaa' } });
        return VCAP_SERVICES.xsuaa;
    } catch (error) {
        console.warn('⚠️ Geen XSUAA-service gevonden. Lokaal draaien zonder OAuth.');
        return null;
    }
}

let cachedToken: string = '';
let tokenExpiry: number = 0;

/**
 * Haalt een nieuw OAuth 2.0 token op of gebruikt een bestaand token als het nog geldig is.
 */
export async function getAccessToken(): Promise<string> {
    const currentTime = Math.floor(Date.now() / 1000);
    const xsuaaCredentials = getXsuaaCredentials(); // ✅ Dynamisch ophalen bij elke aanvraag

    if (!xsuaaCredentials) {
        console.log('🟢 Geen XSUAA gevonden, retourneren van een dummy-token...');
        return 'DUMMY-TOKEN-FOR-LOCAL-TESTING';
    }

    // ✅ Hergebruik het token als deze nog geldig is
    if (cachedToken && tokenExpiry > currentTime) {
        console.log(`🔄 Huidig token nog geldig, hergebruiken. Vervalt op: ${new Date(tokenExpiry * 1000).toISOString()}`);
        return cachedToken;
    }

    console.log('🔄 Token verlopen of niet beschikbaar, nieuw token ophalen...');

    try {
        // ✅ Altijd de nieuwste client credentials gebruiken
        const updatedCredentials = getXsuaaCredentials();
        if (!updatedCredentials) {
            throw new Error('❌ Geen geldige XSUAA-credentials gevonden.');
        }

        // 🔥 Vraag een nieuw token aan
        const response = await axios.post(`${updatedCredentials.url}/oauth/token`, null, {
            params: { grant_type: 'client_credentials' },
            auth: {
                username: updatedCredentials.clientid,
                password: updatedCredentials.clientsecret
            }
        });

        // ✅ Sla de nieuwe token en vervaldatum op
        cachedToken = response.data.access_token;
        tokenExpiry = currentTime + response.data.expires_in - 60; // 60 sec buffer

        console.log(`✅ Nieuw token verkregen! Geldig tot: ${new Date(tokenExpiry * 1000).toISOString()}`);
        return cachedToken;
    } catch (error: any) {
        console.error('❌ Fout bij ophalen access token:', error.response ? error.response.data : error.message);
        throw new Error('Kan geen access token verkrijgen.');
    }
}
