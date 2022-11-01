import axios from "axios";
import AuthService from "./AuthService";
import ConfigService from "./ConfigService";

class SuggestionService {
    private authService = new AuthService();
    private configService = new ConfigService();

    getSuggestedClasses(keyword: string) {
        const url = "https://lov.linkeddata.es/dataset/lov/api/v2/term/search";
        return axios.get(url + '?q=' + keyword + '&type=class');
    }

    getSuggestedProperties(keyword: string) {
        const url = "https://lov.linkeddata.es/dataset/lov/api/v2/term/search";
        return axios.get(url + '?q=' + keyword + '&type=property');
    }

}

export default SuggestionService;