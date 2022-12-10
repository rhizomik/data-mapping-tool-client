import { current } from "@reduxjs/toolkit";
import { Button, Checkbox, Col, Row, Select, Table } from "antd";
import Column from "antd/lib/table/Column";
import React, { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import FileService from "../services/FileService";
import MappingSearchSuggestion from "./MappingSearchSuggestion";

const dataTypeOptions = [
    {
        value: 'string',
        label: 'String'   
    },{
        value: 'integer',
        label: 'Integer'   
    },{
        value: 'float',
        label: 'Float'   
    },{
        value: 'geopoint',
        label: 'Geopoint'   
    }

]

interface InferenceData{
    format: string,
    name: string,
    type: string,
    annotation?: string
}


const CSVMappingColummns = (props: any) => {
    const navigate = useNavigate();
    const {state} = useLocation();
    const {current_file}: any = state;   
    const [primaryKeysCandidates, setPrimaryKeysCandidates] = useState<String[]>([]);
    const [primaryKey, setPrimaryKey] = useState<string | undefined>(undefined);


    const [columns, setColumns] = useState<any>([]);
    const [inferences, setInferences] = useState<{[id: string]: InferenceData} | undefined>(undefined);

    useEffect(() => {
        const fileService = new FileService();
        async function retrieveData() {
            fileService.sample(current_file).then((res) => {     
                setColumns(
                    res.data.columns.map((i: any) => {
                        return {value: i, label: i, dataIndex: i, key: i, title: i}
                    })
                );
            });
            fileService.getInferences(current_file).then((resFilename) => {
                const inferenceDict: {[id: string]: InferenceData} = {};
                resFilename.data.forEach((inference: any) => {
                    inferenceDict[inference.name] = inference
                });
                setInferences(inferenceDict);
            } );
            fileService.getKeys(current_file).then((resFilename) => {
                setPrimaryKeysCandidates(resFilename.data.columns);
            });
            fileService.getPrimaryKey(current_file).then((keyResponse: any) => {
                setPrimaryKey(keyResponse.data);
            });
        }

        retrieveData();   
    }, [current_file]);


    const updateInferences = (dataIndex: string, newValue: any) => {
        if(inferences){
            const localInferences = inferences;
            localInferences[dataIndex].type = newValue;
            setInferences(localInferences);
        }
    }


    const processDataTypeComboBox = (dataType: string) => {
        if(inferences){ 
            const type = inferences[dataType].type;
            return <Select
                    defaultValue={type}
                    options={dataTypeOptions}
                    onChange={(selectedValue, option) => {
                            updateInferences(dataType, selectedValue)
                        }                        
                    }
                >
            </Select>

        }
    }

    const assignAnnotation = (value: string, dataIndex: string) => {
        if(inferences){
            const localInferences = inferences;
            localInferences[dataIndex].annotation = value;
            setInferences(localInferences);
        }
    }

    const getDefaultValueForAnnotation = (dataIndex: string) => {
        if(inferences){
            const type = inferences[dataIndex].type;
            const retrievedValue = inferences[dataIndex].annotation;
            if (retrievedValue){
                return retrievedValue;
            }else{
                return type;
            }
        }
        return undefined;
    }

    const processAnnotation = (dataType: string) => {
        if(inferences){
            const type = inferences[dataType].type;
            if(type === 'integer' || type === 'float'){
                return <MappingSearchSuggestion  
                            defaultValue={inferences[dataType].annotation}                           
                            isMeasure={true}
                            onChange={(selectedValue, option) => {
                                assignAnnotation(selectedValue, dataType)
                            }}
                            fieldName={type}>                                            
                    </MappingSearchSuggestion>
            }else{
                return <MappingSearchSuggestion 
                            defaultValue={getDefaultValueForAnnotation(dataType)}
                            onChange={(selectedValue, option) => {
                                assignAnnotation(selectedValue, dataType)
                            }}
                            fieldName={type}>                                            
                    </MappingSearchSuggestion>
            }
        }
    }

    const assignPrimaryKey = (fieldName: string) => {
        if(!primaryKey){
            setPrimaryKey(fieldName);
        }else{
            setPrimaryKey(undefined);
        }

    }
    
    const processPrimaryKey = (dataType: string) => {
        const isEnabled = primaryKeysCandidates.indexOf(dataType) >= 0 && (primaryKey === dataType || !primaryKey);
        const isChecked = dataType === primaryKey;
        return <Checkbox disabled={!isEnabled} checked={isChecked} onChange={() => {assignPrimaryKey(dataType)}}></Checkbox>        
    }

    const submit = () => {
        const fileService = new FileService();
        const listOfInferences = [];
        for (let key in inferences) {
            const value = inferences[key];
            listOfInferences.push(value);            
        }
        fileService.updateInferences(current_file, listOfInferences);
        fileService.updatePrimaryKey(current_file, primaryKey);
        navigate(-1);
    }

    const back = () => {
        navigate(-1)
    }

    return (
       
            <React.Fragment>
                <Row style={{marginBottom: "3vh"}}>
                    <Col>
                            <Table bordered={true} pagination={{defaultPageSize: 5}} 
                                                dataSource={columns}>
                                <Column title={"Columns"} dataIndex={"dataIndex"}/>
                                <Column title={"Type"} dataIndex={"dataIndex"} 
                                  render={(dataIndex: string) => (                                    
                                        processDataTypeComboBox(dataIndex.trim())
                                  )}
                                />
                                <Column title={"Annotation"} dataIndex={"dataIndex"} 
                                    render={(dataIndex: string) => (                                    
                                        processAnnotation(dataIndex.trim())
                                    )}
                                />
                                <Column title={"Primary key"} dataIndex={"dataIndex"} 
                                    render={(dataIndex: string) => (                                    
                                        processPrimaryKey(dataIndex.trim())
                                    )}
                                />
                            </Table>
                    </Col>
                </Row>
                <Row>
                    <Col>
                        <Button onClick={back}>Back</Button>
                        <Button type={"primary"} style={{marginLeft: "1vh"}}
                                onClick={submit}>Submit</Button>
                    </Col>
                </Row>
            </React.Fragment>
    )
}

export default CSVMappingColummns;

