declare module '@sap/xsenv' {
    export function loadEnv(): void;
    export function getServices(service: { xsuaa: { tag: string } }): { xsuaa: { url: string; clientid: string; clientsecret: string } };
}
