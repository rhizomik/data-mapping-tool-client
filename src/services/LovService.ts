import axios from "axios";

class LovService {  
    
    getVocabularySearch(query: string) {
        const url = `https://lov.linkeddata.es/dataset/lov/api/v2/vocabulary/search?q=${query}&lang=English`;
        return axios.get(url);
    }

}

export default LovService;