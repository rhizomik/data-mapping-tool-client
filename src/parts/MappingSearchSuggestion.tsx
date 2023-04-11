import {Select} from "antd";
import React from "react";
import OntologyService from "../services/OntologyService";
import SuggestionService from "../services/SuggestionService";

interface IMappingSearchSuggestionProps {
    fieldName: string;
    defaultValue?: string | string [];
    isMeasure?: boolean;
    suggestions?: any;
    notifySelectedPrefix?: any;
    onChange?: ((value: any, option: never[]) => void);
}

interface IMappingSearchSuggestionState {
    suggestions: [],
    selections: []
}


export default class MappingSearchSuggestion extends React.Component<IMappingSearchSuggestionProps, IMappingSearchSuggestionState> {
    private suggestionService = new SuggestionService();
    private ontologyService = new OntologyService();
    private prefixDict: { [key: string]: string[] }  = {};

    
    
    constructor(props: any){
        super(props);
        this.state = {
            suggestions: [],
            selections: []
        };
        this.searchProperties = this.searchProperties.bind(this);
        this.annotateChange = this.annotateChange.bind(this);
    }
    
    componentDidMount(){
        this.searchProperties(this.props.fieldName);
    }


    searchProperties = (textToSearch : string) => {
        const listOfSuggestions: Array<{}> = [];
        if(this.props.isMeasure){
            const prefix = 'om';
            const uri = 'http://www.ontology-of-units-of-measure.org/resource/om-2';
            this.ontologyService.getMeasureSuggestions(textToSearch).then((res: any) => {
                Array.prototype.forEach.call(res.data.classes, element => {  
                    listOfSuggestions.push({value:element, label:element, uri: uri, prefix: prefix});   
                    // this.prefixDict[element] = uri;        
                  });  
                  
                this.setState((state: any) => ({
                    suggestions: state.suggestions.concat(listOfSuggestions)
                }));        
                if(this.props.suggestions){
                    this.props.suggestions(listOfSuggestions);
                }
            });
        }
        else{
            this.suggestionService.getSuggestedProperties(textToSearch).then((res) => {
                const results = res.data.results;                
    
                Array.prototype.forEach.call(results, element => {
                    const name = element['prefixedName'][0];
                    const prefix = name.split(';')[0];     
                    listOfSuggestions.push({value:name, label:name, uri: element['uri'], prefix: prefix});       
                    this.prefixDict[element['prefixedName'][0]] = element['uri'];
                  });  
                  
                this.setState((state: any) => ({
                    suggestions: state.suggestions.concat(listOfSuggestions)
                }));  
                if(this.props.suggestions){
                    this.props.suggestions(listOfSuggestions);
                }
            });
        }

    }

    annotateChange(selectedValue: string[], option: never[]) { 
        if(this.props.onChange){
            this.props.onChange(selectedValue, option);           
        }
        // if(this.props.notifySelectedPrefix){
        //     this.props.notifySelectedPrefix(selectedValue, this.prefixDict[selectedValue]);
        // }        
    }

    getDefaultValue(): string[]{
        if(this.props.defaultValue){
            const value = this.props.defaultValue;
            if (Array.isArray(value) ){
                return value;
            }
            return [value]
        }
        return [''];
    }

    render() {
        const defaultValue = this.getDefaultValue();
        if(defaultValue === undefined){
            return <div></div>
        }
        return  <Select  
                    mode="multiple"
                    showSearch={true}             
                    allowClear style={{ width: '100%' }} 
                    placeholder="Properties suggestions"                    
                    options={this.state.suggestions}
                    onSearch={this.searchProperties}
                    onChange={this.annotateChange}
                    defaultValue={defaultValue}
                    defaultActiveFirstOption
                    >               
                </Select>
    }
  }
