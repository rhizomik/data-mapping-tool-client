import { StringGradients } from "antd/lib/progress/progress";
import axios from "axios";
import AuthService from "./AuthService";
import ConfigService from "./ConfigService";

class DataverseService {
    private authService = new AuthService();
    private configService = new ConfigService();

    public exploreDataverse(url: string, name: string, filter: string) {
        const headers = {
            'Authorization': 'Bearer ' + this.authService.hasCredentials()
        };

        const args = {
            'url': url,
            'name': name,
            'filter': filter
        };

        return axios.get(this.configService.getConfig().api_url + `/dataverses/`, {
            headers: headers,
            params: args
        });
       
    }

    public download(url: string, name: string, idFile: string) {
        const headers = {
            'Authorization': 'Bearer ' + this.authService.hasCredentials(),
            responseType: 'blob' 
        };

        const args = {
            'url': url,
            'name': name,
            'id': idFile
        };

        return axios.get(this.configService.getConfig().api_url + `/dataverses/datafile`, {
            responseType: 'blob',
            headers: headers,
            params: args
        });
       

    }
}

export default DataverseService;