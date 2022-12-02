import {Select} from "antd";
import React from "react";
import OntologyService from "../services/OntologyService";
import SuggestionService from "../services/SuggestionService";

interface IMappingSearchSuggestionProps {
    fieldName: string;
    defaultValue?: string;
    isMeasure?: boolean;
    onChange?: ((value: any, option: never[]) => void);
}

interface IMappingSearchSuggestionState {
    suggestions: [],
    selections: []
}


export default class MappingSearchSuggestion extends React.Component<IMappingSearchSuggestionProps, IMappingSearchSuggestionState> {
    private suggestionService = new SuggestionService();
    private ontologyService = new OntologyService();

    constructor(props: any){
        super(props);
        this.state = {
            suggestions: [],
            selections: []
        };
        this.searchProperties = this.searchProperties.bind(this);
    }
    
    componentDidMount(){
        this.searchProperties(this.props.fieldName);
    }


    searchProperties = (textToSearch : string) => {
        const listOfSuggestions: Array<{}> = [];
        if(this.props.isMeasure){
            this.ontologyService.get_measure_suggestions(textToSearch).then((res: any) => {  

                Array.prototype.forEach.call(res.data.classes, element => {                    
                    listOfSuggestions.push({value:element, label:element})           
                  });  
                  
                this.setState((state: any) => ({
                    suggestions: state.suggestions.concat(listOfSuggestions)
                }));        
            });
        }
        else{
            this.suggestionService.getSuggestedProperties(textToSearch).then((res) => {
                const results = res.data.results;                
    
                Array.prototype.forEach.call(results, element => {
                    const name = element['prefixedName'][0];
                    listOfSuggestions.push({value:name, label:name})           
                  });  
                  
                this.setState((state: any) => ({
                    suggestions: state.suggestions.concat(listOfSuggestions)
                }));  
            });
        }

    }

    render() {
        return  <Select  
                    showSearch={true}             
                    allowClear style={{ width: '100%' }} 
                    placeholder="Properties suggestions"                    
                    options={this.state.suggestions}
                    onSearch={this.searchProperties}
                    onChange={this.props.onChange}
                    defaultValue={this.props.defaultValue}
                    defaultActiveFirstOption
                    >               
                </Select>
    }
  }
