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
            'filter_by': filter
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

    public createOntologyFromFile(url: string, name: string, idFile: string, ontologyName: string){
        const headers = {
            'Authorization': 'Bearer ' + this.authService.hasCredentials()           
        };

        const args = {
            'url': url,
            'name': name,
            'id': idFile,
            'ontology_name': ontologyName
        };

        return axios.get(this.configService.getConfig().api_url + `/dataverses/ontology/`, {
            headers: headers,
            params: args
        });
    }

    public registerFileFromRepository(url: string, name: string, idFile: string) {
        const headers = {
            'Authorization': 'Bearer ' + this.authService.hasCredentials()           
        };

        const args = {
            'url': url,
            'name': name,
            'id': idFile     
        };

        return axios.get(this.configService.getConfig().api_url + `/dataverses/file/`, {
            headers: headers,
            params: args
        });
    }
}

export default DataverseService;