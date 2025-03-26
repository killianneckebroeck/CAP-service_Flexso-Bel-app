import { Service } from "@sap/cds";
import { getAccessToken } from "./token-service";

export default class AuthService extends Service {
    async init() {
        this.on("READ", "token", async (req) => {
            try {
                const token = await getAccessToken();
                return { access_token: token };
            } catch (error) {
                console.error("❌ Kan geen access token ophalen:", error);
                req.error(500, "Kan geen access token ophalen.");
            }
        });
    }
}
