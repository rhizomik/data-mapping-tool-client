import AuthService from "./AuthService";
import ConfigService from "./ConfigService";
import axios from "axios";

class PrefixService {
    private authService = new AuthService();
    private configService = new ConfigService();

    getPrefix(prefixName: string) {
        const headers = {
            'Authorization': 'Bearer ' + this.authService.hasCredentials()
        };

        return axios.get(this.configService.getConfig().api_url + '/prefixes/' + prefixName, {headers: headers});
    }

    addPrefix(payload: object) {
        const headers = {
            'Authorization': 'Bearer ' + this.authService.hasCredentials()
        };       

        return axios.post(this.configService.getConfig().api_url + '/prefixes/', payload, {headers: headers});

    }
}

export default PrefixService;