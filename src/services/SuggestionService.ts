import axios from "axios";
import AuthService from "./AuthService";
import ConfigService from "./ConfigService";

class SuggestionService {
    private authService = new AuthService();
    private configService = new ConfigService();

    private suggestionClassesUrl = "https://lov.linkeddata.es/dataset/lov/api/v2/term/search";
    private suggestionPropertiesUrl = "https://lov.linkeddata.es/dataset/lov/api/v2/term/search";
    private suggestionMeasureUrl = "https://lov.linkeddata.es/dataset/lov/api/v2/term/search";

    constructor(){
        this.getSuggestedClasses = this.getSuggestedClasses.bind(this);
        this.getSuggestedProperties = this.getSuggestedProperties.bind(this);
        this.getMeasureSuggestions = this.getMeasureSuggestions.bind(this);
    }

    getSuggestedClasses(keyword: string) {      
        return axios.get(this.suggestionClassesUrl + '?q=' + keyword + '&type=class');
    }

    getSuggestedProperties(keyword: string) {
        return axios.get(this.suggestionPropertiesUrl + '?q=' + keyword + '&type=property');
    }

    getMeasureSuggestions(keyword: string){
        return axios.get(this.suggestionMeasureUrl + '?q=' + keyword + '&type=class&vocab=oum');
    }

}

export default SuggestionService;