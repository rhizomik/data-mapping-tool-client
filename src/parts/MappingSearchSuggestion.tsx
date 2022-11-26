import {Select} from "antd";
import React from "react";
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
        let suggestionCaller = this.suggestionService.getSuggestedProperties;
        if(this.props.isMeasure){
            suggestionCaller = this.suggestionService.getMeasureSuggestions;
        }

        suggestionCaller(textToSearch).then((res) => {
            const results = res.data.results;
            const listOfSuggestions: Array<{}> = [];

            Array.prototype.forEach.call(results, element => {
                const name = element['prefixedName'][0];
                listOfSuggestions.push({value:name, label:name})           
              });  
              
            this.setState((state: any) => ({
                suggestions: state.suggestions.concat(listOfSuggestions)
            }));  
        });
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
