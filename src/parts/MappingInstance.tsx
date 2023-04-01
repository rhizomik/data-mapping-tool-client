import {useLocation, useNavigate} from "react-router-dom";
import {Button, Col, Divider, message, Modal, Popconfirm, Row, Select, Table} from "antd";
import React, {useEffect, useState} from "react";
import InstanceService from "../services/InstanceService";
import FileService from "../services/FileService";
import OntologyService from "../services/OntologyService";
import {LockOutlined, QuestionCircleOutlined, TableOutlined, UnlockOutlined} from "@ant-design/icons";
import MappingSearchSuggestion from "./MappingSearchSuggestion";


const {Column} = Table;

interface PrefixInfoModel{
    prefix: string,
    uri: string
}

interface InferenceData{
    format: string,
    name: string,
    type: string,
    subtype: string,
    annotation: string | string[],
    prefix?: PrefixInfoModel
}

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

const MappingInstance = (props: any) => {

    const {state} = useLocation();
    const navigate = useNavigate();
    const {_id, _class, files, current_file}: any = state;

    const instanceService = new InstanceService();
    const ontologyService = new OntologyService();
    const fileService = new FileService();

    const [subject, setSubject] = useState<any>(null);
    const [selectedFile, setSelectedFile] = useState(current_file);
    const [columns, setColumns] = useState<any>([])
    const [sample, setSample] = useState<any>([])
    const [instance, setInstance] = useState<any>({})
    const [properties, setProperties] = useState<any>([])
    const [mapping, setMapping] = useState<any>({})
    const [typeValues, setTypeValues] = useState<any>({})
    const [isMappingSelected, setIsMappingSelected] = useState<boolean>(false);
    const [inferences, setInferences] = useState<{[id: string]: InferenceData} | undefined>(undefined)
    const [suggerenceList, setSuggerenceList] = useState<Array<{value: string, label: string, uri: string, prefix: string}>>([]);

    const [lock, setLock] = useState(true);
    const [sampleVisible, setSampleVisible] = useState(false);
    const [loading, setLoading] = useState<any>({ontology: false, sample: false, instance: false})


    const getSample = (filename: string) => {
        setLoading({...instance, sample: true})
        fileService.sample(filename).then((res) => {
            setSample(res.data.sample);
            setColumns(res.data.columns.map((i: any) => {
                return {value: i, label: i, dataIndex: i, key: i, title: i}
            }));
            setLoading({...loading, sample: false});
            fileService.getInferences(filename).then((resFilename) => {
                const inferenceDict: {[id: string]: InferenceData} = {};
                resFilename.data.forEach((inference: any) => {
                    inferenceDict[inference.name] = inference
                });
                setInferences(inferenceDict);
            } )
        }).catch((err) => {
            message.error(err.toString())
            setLoading({...loading, sample: false})
        })
    }

    const getInstance = () => {
        setLoading({...loading, instance: true})
        instanceService.getInstance(_id).then((res) => {
            setInstance(res.data.data);            
            if(res.data.data.mapping.hasOwnProperty(_class)){
                setMapping(res.data.data.mapping[_class].columns);
                setSubject(res.data.data.mapping[_class].subject);                      
                if(res.data.data.current_ontology.length > 0){
                    getOntology(res.data.data.current_ontology); 
                }                                
            }else{               
                defineMapping(res.data.data);
            }
            
            setLoading({...loading, instance: false});
        }).catch((err) => {
            message.error(err.toString());
            setLoading({...loading, instance: false})
        })
    }

    const getOntology = (id: string) => {
        

        setLoading({...loading, ontology: true})
        ontologyService.getProperties(id, "data", {classes: _class}).then((res) => {            
            setProperties(res.data.data)
            setLoading({...loading, ontology: false})
        }).catch((err) => {
            message.error(err.toString())
            setLoading({...loading, ontology: false})
        })
    }

    const defineMapping = (instance_response: any) => {
        instance_response.mapping[_class]  = {
            columns: {},
            fileSelected: current_file,
            status: false
        };          
    }


    const back = () => {
        navigate(-1)
    }


    const submit = () => {
        let newInstance = instance;       
        newInstance.mapping[_class].columns = mapping;
        newInstance.mapping[_class].fileSelected = selectedFile;
        newInstance.mapping[_class].subject = subject;
        instanceService.editInstances(_id, {mapping: newInstance.mapping}).catch((err) => {
            message.error(err.toString())
        })
        const listOfInferences = [];
        for (let key in inferences) {
            const value = inferences[key];
            listOfInferences.push(value);            
        }
        fileService.updateInferences(selectedFile, listOfInferences);
        navigate(-1);
    }

    const onChangeTable = (selectedValue: any, ontology_value: any) => {        
        setMapping({...mapping, [ontology_value.name]: selectedValue}); 
    }


    const onChangeSelectFile = (value: string) => {
        setSelectedFile(value);
        getSample(value);
        setSubject(null); // reset subject
        setMapping({}) // reset select
    }

    useEffect(() => {
        getSample(current_file)
        getInstance()
    }, [])

    // Modal
    const openSampleModal = () => {
        setSampleVisible(true);
    }

    const closeSampleModal = () => {
        setSampleVisible(false);
    }

    const updateInferences = (dataIndex: string, newValue: any) => {
        if(inferences){
            const localInferences = inferences;
            localInferences[dataIndex].type = newValue;
            setInferences(localInferences);
            setTypeValues({...typeValues, [dataIndex]: newValue}); 
            assignAnnotation('', dataIndex);
        }
    }

    const processDataTypeComboBox = (key: string) => {
        const keySplitted = key.split(':');
        const nameOfKey = keySplitted[keySplitted.length - 1];
        if(inferences && nameOfKey !== undefined){  
            const columnName = mapping[nameOfKey];   
            let type = 'integer';
            const isArray = Array.isArray(columnName);
            const isRealArray = isArray && columnName.length  > 1;



            if(columnName){  
                if(!(columnName in typeValues)){
                    if (!isArray || !isRealArray ){     
                        return <Select
                                    value={type}
                                    options={dataTypeOptions}
                                    onChange={(selectedValue, option) => {
                                            updateInferences(columnName, selectedValue)
                                        }                        
                                    }
                                >
                            </Select>
                    }                  
                }                                
                
            }

        }
    }


    const assignAnnotation = (value: string, dataIndex: string) => {        
        if(inferences){
            const localInferences = inferences;
            if(Array.isArray(dataIndex)){
                dataIndex.forEach(element => {localInferences[element].annotation = value; })
            }else{
                localInferences[dataIndex].annotation = value;
            }
            
            setInferences(localInferences);            
        }
    }

    const setSuggestionPrefixData = (name: string, uri: string, datatype: string) => {
        if(inferences){
            const prefix = name.split('.')[0];        
            const localInferences = inferences;
            localInferences[datatype].prefix = {'prefix': prefix, 'uri': uri};      
            setInferences(localInferences);            
        }    
    }

    const getDefaultValueForAnnotation = (dataIndex: string) => {
        if(inferences){
            const type = inferences[dataIndex].type;
            const subtype = inferences[dataIndex].subtype;
            const retrievedValue = inferences[dataIndex].annotation;
            if (retrievedValue){
                return retrievedValue;
            }else{
                return (subtype && subtype.length > 0) ? subtype: type;
            }
        }
        return undefined;
    }

    const saveSuggestionList = (suggestionList: Array<{value: string, label: string, uri: string, prefix: string}>) => {
        setSuggerenceList(suggestionList);
    }

    const processAnnotationElements = (annotation: string | string[] | undefined) =>{
        if(!annotation){
            return [];
        }
        if(Array.isArray(annotation)){
            let response = [];
            for(let i = 0; i < annotation.length; ++i){
                response.push(annotation[i]);
            }
            return response;           
        }else{
            return [annotation];
        }
        


    }

    const processAnnotation = (key: string) => {
        const keySplitted = key.split(':');
        const nameOfKey = keySplitted[keySplitted.length - 1];
        if(inferences && nameOfKey !== undefined){     
            const columnName = mapping[nameOfKey];

            if(!columnName){  
                return;
            }

            let type = 'string';
            if(Array.isArray(columnName)){
                let isNumeric = true;
                 columnName.forEach(element => {
                    const elementType = inferences[element].type;
                    if(elementType !== 'integer' && elementType !== 'float'){
                        isNumeric = false;
                    }
                    if(isNumeric){
                        type = 'integer';
                    }                   
                 })
            }else{
                type = inferences[columnName].type; 
            }
                  
            let annotation: string[] = [];
            if(Array.isArray(columnName)){              
                for(let i = 0; i < columnName.length; ++i){        
                    annotation = [...annotation, ...processAnnotationElements(inferences[columnName[i]].annotation)]; 
                }
            }else{
                annotation.push(columnName);
            }   
            annotation = annotation.filter(function(item, pos) {
                return annotation.indexOf(item) === pos;
            })
 
            if(type === 'integer' || type === 'float'){
                return <MappingSearchSuggestion  
                            defaultValue={annotation}                           
                            isMeasure={true}
                            suggestions={saveSuggestionList}
                            onChange={(selectedValue, option) => {
                                assignAnnotation(selectedValue, columnName);                             
                            }}
                            notifySelectedPrefix={(name: string, uri: string)=> {
                                setSuggestionPrefixData(name, uri, columnName);
                            }}
                            fieldName={type}>                                            
                    </MappingSearchSuggestion>
            }else{                
                return <MappingSearchSuggestion 
                            defaultValue={getDefaultValueForAnnotation(columnName)}
                            suggestions={saveSuggestionList}
                            onChange={(selectedValue, option) => {
                                assignAnnotation(selectedValue, columnName)
                            }}
                            notifySelectedPrefix={(name: string, uri: string)=> {
                                setSuggestionPrefixData(name, uri, columnName);
                            }}
                            fieldName={type}>                                            
                    </MappingSearchSuggestion>
            }
        }
    }


    return (
        <>
            <Modal width={"200vh"} title={selectedFile} visible={sampleVisible} footer={null}
                   onCancel={closeSampleModal}>
                <Table scroll={{x: 500}} size={"small"} loading={loading.sample}
                       pagination={{defaultPageSize: 5, showSizeChanger: true, pageSizeOptions: [5, 10, 15]}}
                       bordered={true} dataSource={sample} columns={columns}/>
            </Modal>

            <Row style={{marginBottom: "3vh"}}>
                <Col span={22}>
                    <Select disabled={lock} style={{width: "50vh"}} options={files} loading={files.length === 0}
                            value={selectedFile}
                            onChange={(value: string) => onChangeSelectFile(value)}/>

                    <Popconfirm title="Are you sure？" onConfirm={() => {
                        setLock(!lock)
                    }}
                                icon={<QuestionCircleOutlined style={{color: 'red'}}/>}>
                        <Button type={"text"} icon={lock ? <LockOutlined/> : <UnlockOutlined/>}/>
                    </Popconfirm>
                </Col>
                <Col span={1}/>
                <Col span={1}>
                    <Button shape={"circle"} icon={<TableOutlined/>} onClick={openSampleModal}/>
                </Col>
            </Row>
            <Divider/>
            <Row>
                <Col span={10}>
                    <h4><b>Subject:</b></h4>
                    <Select showSearch style={{width: "50vh"}} options={columns}
                            placeholder={"Select Subject"} value={subject} onChange={setSubject}/>

                </Col>
            </Row>
            <Divider/>            
            <React.Fragment>
            <Row>
                <Col span={24}>
                    <h4><b>Mapping:</b></h4>
                    <Table bordered={true} pagination={{defaultPageSize: 5}} loading={loading.ontology}
                           dataSource={properties}>
                        <Column title={"Properties"} dataIndex={"value"}/>
                        <Column title={"Data set column"} render={(ontology_value, record, index) => {
                            return (<>
                                <Select style={{width: "50vh"}}
                                        mode="multiple"
                                        showSearch
                                        allowClear={true}
                                        loading={loading.instance}
                                        value={mapping[ontology_value.name]}
                                        options={columns} onChange={(selectedValue, option) => {
                                    onChangeTable(selectedValue, ontology_value)
                                }}/>
                            </>)
                        }}/>
                        <Column title={"Type"} dataIndex={"value"} 
                                  render={(dataIndex: string) => (                                                                
                                        processDataTypeComboBox(dataIndex.trim())
                                  )}
                        />
                        <Column title={"Annotation"} dataIndex={"value"} 
                                    render={(dataIndex: string) => (                                    
                                        processAnnotation(dataIndex.trim())
                                    )}
                        />
                    </Table>
                </Col>
            </Row>
            </React.Fragment>
            <Row>
                <Col>
                    <Button onClick={back}>Back</Button>
                    <Button disabled={!subject} type={"primary"} style={{marginLeft: "1vh"}}
                            onClick={submit}>Submit</Button>
                </Col>
            </Row>
        </>
    )

}
export default MappingInstance;
