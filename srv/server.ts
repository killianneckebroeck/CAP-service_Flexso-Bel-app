import cds from '@sap/cds';
import express, { Request, Response } from 'express';
import axios from 'axios';
import * as xsenv from '@sap/xsenv';

const app = express();
cds.on('bootstrap', async (app) => {
    // ✅ CORS inschakelen voor lokale UI5 ontwikkeling
    app.use((req, res, next) => {
        res.setHeader('Access-Control-Allow-Origin', '*');
        res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, PATCH, DELETE, OPTIONS');
        res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
        next();
    });

    console.log('✅ CORS is ingeschakeld');

    // ✅ OAuth-token endpoint
    app.get('/api/token', async (req: Request, res: Response) => {
        try {
            const xsuaa = xsenv.getServices<{ xsuaa: { url: string, clientid: string, clientsecret: string } }>({ xsuaa: { tag: 'xsuaa' } }).xsuaa;
            
            const response = await axios.post(`${xsuaa.url}/oauth/token`, null, {
                params: { grant_type: 'client_credentials' },
                auth: {
                    username: xsuaa.clientid,
                    password: xsuaa.clientsecret
                }
            });

            res.json({ access_token: response.data.access_token });
        } catch (error) {
            console.error('❌ Fout bij ophalen OAuth token:', error);
            res.status(500).json({ error: 'OAuth-token ophalen mislukt' });
        }
    });

    console.log('🚀 CAP-service draait met OAuth 2.0 authenticatie!');
});

export default cds.server;
