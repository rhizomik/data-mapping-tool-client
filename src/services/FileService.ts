import AuthService from "./AuthService";
import ConfigService from "./ConfigService";
import axios from "axios";

class FileService {
    private authService = new AuthService();
    private configService = new ConfigService();

    download(filename: string) {
        const headers = {
            'Authorization': 'Bearer ' + this.authService.hasCredentials()
        };

        return axios.get(this.configService.getConfig().api_url + '/files/download/' + filename, {
            headers: headers,
            responseType: 'blob'
        });

    }

    upload(data: FormData) {
        const headers = {
            'Authorization': 'Bearer ' + this.authService.hasCredentials()
        };

        return axios.post(this.configService.getConfig().api_url + '/files/upload', data, {headers: headers});

    }

    sample(filename: string) {
        const headers = {
            'Authorization': 'Bearer ' + this.authService.hasCredentials()
        };

        return axios.get(this.configService.getConfig().api_url + '/files/' + filename, {headers: headers});
    }

    getInferences(filename: string){
        const headers = {
            'Authorization': 'Bearer ' + this.authService.hasCredentials()
        };

        return axios.get(this.configService.getConfig().api_url + '/files/inferences/' + filename, {headers: headers});
    }

    updateInferences(filename: string, inferences: any){
        const headers = {
            'Authorization': 'Bearer ' + this.authService.hasCredentials()
        };

        return axios.post(this.configService.getConfig().api_url + '/files/inferences/' + filename, {'inferences': inferences}, {headers: headers});
    }

    updatePrimaryKey(filename: string, primaryKey: string | undefined){
        const headers = {
            'Authorization': 'Bearer ' + this.authService.hasCredentials()
        };

        return axios.post(this.configService.getConfig().api_url + '/files/key/' + filename, {'key': primaryKey}, {headers: headers});
    }

    getPrimaryKey(filename: string){
        const headers = {
            'Authorization': 'Bearer ' + this.authService.hasCredentials()
        };

        return axios.get(this.configService.getConfig().api_url + '/files/key/' + filename, {headers: headers});
    }

    getKeys(filename: string){
        const headers = {
            'Authorization': 'Bearer ' + this.authService.hasCredentials()
        };

        return axios.get(this.configService.getConfig().api_url + '/files/keys/' + filename, {headers: headers});
    }

}

export default FileService;