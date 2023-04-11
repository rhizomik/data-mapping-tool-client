import {useNavigate, useParams} from "react-router-dom";
import React, {useEffect, useState} from "react";
import OntologyService from "../services/OntologyService";
import VirtualList from 'rc-virtual-list';

import {
    Button,
    Card,
    Col,
    Divider,
    Form,
    Input,
    message,
    Modal,
    Progress,
    Row,
    Select,
    Space,
    Switch,
    Table,
    Tabs,
    Tag,
    List,
    Tooltip,
    Upload    
} from "antd";
import InstanceService from "../services/InstanceService";
import {
    AppstoreAddOutlined,
    CaretRightOutlined,
    CheckOutlined,
    ClearOutlined,
    CloseOutlined,
    CloudDownloadOutlined,
    CloudUploadOutlined,
    DownOutlined,
    DeleteOutlined,
    FileSearchOutlined,
    InboxOutlined,
    LinkOutlined,
    LockOutlined,
    PlusOutlined,
    RollbackOutlined,
    SearchOutlined,
    SettingOutlined,
    UnlockOutlined
} from '@ant-design/icons';
import {useForm} from "antd/lib/form/Form";
import {alphabeticalSort} from "../utils/sorter";
import ConfigService from "../services/ConfigService";
import AuthService from "../services/AuthService";
import FileService from "../services/FileService";
import fileDownload from 'js-file-download';
import MappingService from "../services/MappingService";
import DataverseService from "../services/DataverseService";
import DataVerseSpace from "../interfaces/Dataverse-space.interface";
import SuggestionService from "../services/SuggestionService";

const {Column} = Table;
const {Meta} = Card;
const {Dragger} = Upload;

const InstanceDetailPage = () => {
    const params = useParams();
    const navigate = useNavigate();

    // Services
    const ontologyService = new OntologyService();
    const instanceService = new InstanceService();
    const suggestionService = new SuggestionService();
    const fileService = new FileService();
    const mappingService = new MappingService();
    const configService = new ConfigService().getConfig();
    const authService = new AuthService();
    const dataverseService = new DataverseService();

    const [dataRepository, setDataRepository] = useState<DataVerseSpace[]>([]);
    
    // Variables
    const [classes, setClasses] = useState<any>([]);
    const [suggestedClasses, setSuggestedClasses] = useState<any>([]);
    const [isSuggestionAccepted, setIsSuggestionAccepted] = useState<boolean>(false);
    const [isOntologyReady, setIsOntologyReady] = useState<boolean>(false);
    const [acceptedSearch, setAcceptedSearch] = useState<string>("");
    const [searchedClasses, setSearchedClasses] = useState<any>([]);
    const [acceptedSuggestedClasses, setAcceptedSuggestedClasses] = useState<string>("");
    const [acceptedSearchedClasses, setAcceptedSearchedClasses] = useState<string>("");
    const [suggestedProperties, setSuggestedProperties] = useState<any>([]);
    const [isAutossugest, setAutosuggest] = useState<boolean>(false);
    const [instance, setInstance] = useState<any>({});
    const [currentOntology, setCurrentOntology] = useState<any>({});
    const [generateConfig, setGenerateConfig] = useState<any>([]);
    const [generateOptions, setGenerateOptions] = useState<any>([]);
    const [relations, setRelations] = useState<any>([]);
    const [ontologies, setOntologies] = useState<any>([]);

    //References
    const [handleDuplicatedModalCaller, setHandleDuplicatedModalCaller] = useState<string>("");
    const [duplicatedSelectedClass, setDuplicatedSelectedClass] = useState<string>("");
    const [duplicatedSelectedIndex, setDuplicatedSelectedIndex] = useState<number>(0);
    
    // Search
    const [classSearch, setClassSearch] = useState<any>([])
    const [relationSearch, setRelationSearch] = useState<any>([])

    // Booleans
    const [visibleClasses, setVisibleClasses] = useState(false);
    const [visibleEditInstance, setVisibleEditInstance] = useState(false);
    const [visibleUpload, setVisibleUpload] = useState(false);
    const [lock, setLock] = useState(true);
    const [duplicatedModalOpen, setDuplicatedModalOpen] = useState(false);

    // Forms
    const [classesForm] = useForm();
    const [editForm] = useForm();
    const [uploadForm] = useForm();
    const [dataVerseSearchForm] = useForm();

    const [isSearchStarted,setIsSearchStarted] = useState<boolean>();
    const [isSearchFinished,setIsSearchFinished] = useState<boolean>();
   

    // loading
    const [loading, setLoading] = useState<any>({instances: false, classes: false});


    useEffect(() => {
        getInstanceInfo();

    }, []);

    const getInstanceInfo = () => {
        setLoading({...loading, instances: true})

        instanceService.getInstance(params.id).then((res) => {

            let data = res.data.data
            if(!data["suggest_ontology"]){
                getOntologyInUse(data.current_ontology);
                getClasses(data.current_ontology);
            }

            setInstance(data)

            // generate select init values
            setGenerateConfig((data.classes_to_map))
            setGenerateOptions(data.classes_to_map.map((i: string) => {
                return {value: i, label: i}
            }));

            setClassSearch(data.classes_to_map);
            if(!data["suggest_ontology"]){
                getRelations(data)
            }
            setLoading({...loading, instances: false})

        }).catch((err) => {
            message.error(err.toString())
            setLoading({...loading, instances: false})
        })
    }

    const getOntologyInUse = (ontologyId: string) => {
        ontologyService.getOntologies().then(res => {
            setOntologies(res.data.data.map((i: any) => {
                if (i._id === ontologyId) {                
                    setCurrentOntology({value: i._id, label: i.ontology_name})
                }
                return {value: i._id, label: i.ontology_name}
            }))
        }).catch((err) => {
            message.error(err.toString())
        })
    }

    const selectedRepositoryFile = (idFile: string, filename: string) => { 
        dataverseService.registerFileFromRepository(
            dataVerseSearchForm.getFieldValue('dataverse_url'),
            dataVerseSearchForm.getFieldValue('repository_name'),
            idFile
            ).then((res) => {        
                let aux_files = Array.from(new Set(instance.filenames.concat([filename])));

                instanceService.editInstances(params.id, {filenames: aux_files}).then((res) => {
                    setInstance(res.data.instance);
                    message.success(res.data.successful)
                }).catch(err => message.error(err.toString()))
                closeUploadModal();
                
            });       
        }

    const filteredList = (listOfData: any) => {
        const listOfLabels: string[] = [];
        const filteredList = [];
        const receivedData = listOfData;

        for(let i = 0; i < receivedData.length; ++i){
            const element = receivedData[i];
            if(listOfLabels.indexOf(element['label']) === -1){
                filteredList.push(element);
                listOfLabels.push(element['label']);
            }
        }
        return receivedData;
    }

    const getClasses = (id: string) => {
        setLoading({...loading, classes: true})
        ontologyService.getClasses(id).then((res) => {
            setClasses(res.data.data);
            setLoading({...loading, classes: false})
        }).catch((err) => {
            message.error(err.toString())
            setLoading({...loading, classes: false})
        });
    }

    const getRelations = (instance: any) => {
        ontologyService.getRelationsBetweenClasses(instance.current_ontology, {classes: instance.classes_to_map}).then((res) => {          
            let rel = Object.keys(res.data.relations).map((rel: string) => {
                return instance.relations[rel]
            })

            setRelations(rel);
            setRelationSearch(rel);
        });
    }

    // Class Modal

    const closeClasses = () => {
        setVisibleClasses(false);
        classesForm.resetFields();
    }

    const showClasses = () => {
        classesForm.setFieldsValue({select: instance.classes_to_map})
        setVisibleClasses(true);
        autoSuggest();
    }

    const onFinishClasses = () => {
        let values = classesForm.getFieldValue('select');

        // set new values
        setGenerateConfig(values);
        setGenerateOptions(values.map((i: string) => {
            return {value: i, label: i}
        }));

        let newInstance = {...instance, classes_to_map: values}

        setInstance(newInstance);
        
        getRelations(newInstance);
        
        setClassSearch(values);        

        closeClasses();

        instanceService.editInstances(params.id, {
            classes_to_map: values,
        }).catch((err) => {
            message.error(err.toString())
        })

    }

    // Edit Instance Modal

    const showEditInstance = () => {
        setVisibleEditInstance(true);
    }

    const closeEditInstance = () => {
        setVisibleEditInstance(false);
    }

    const onFinishEditInstance = () => {
        instanceService.editInstances(params.id, editForm.getFieldsValue()).then((res) => {
            closeEditInstance();
            setInstance(res.data.instance)
            message.success(res.data.successful);
        }).catch((err) => {
            message.error(err.toString())
        })
    }

    const onChangeDragger = (info: any) => {
        const {status} = info.file;
        if (status !== 'uploading') {
            console.log(info.file, info.fileList);
        }
        if (status === 'error') {
            message.error(`${info.file.name} file upload failed.`, 2);
        }
    }

    const autoSuggest = () => {
        setAutosuggest(true);  
        const listOfSuggestions: Array<{}> = [];
        setSuggestedClasses(listOfSuggestions);
 
        for( let i = 0; i < instance.filenames.length; ++i){
            const pre_processed_filename = instance.filenames[i].split('.')[0];
            suggest(true, pre_processed_filename);
        }  
    }
    
    const handleSuggestedClasses = (value: string) => {
        setAcceptedSuggestedClasses(value);
    }

    const handleSearchedClasses = (value: string) => {
        setAcceptedSearchedClasses(value);
    }
    
    const acceptSuggestions = () => {
        const classesToAdd: any[] = [];
       
        suggestedClasses.forEach((element: any) => {
            if (acceptedSuggestedClasses.includes(element.value)){
                classesToAdd.push(element);
            }
            
        });
        setClasses(classes.concat(classesToAdd));  
        setAcceptedSearch(acceptedSuggestedClasses);
        setIsSuggestionAccepted(true);
    }

    const acceptSearch = () => {
        const classesToAdd: any[] = [];
       
        searchedClasses.forEach((element: any) => {
            if (acceptedSearchedClasses.includes(element.value)){
                classesToAdd.push(element);
            }
            
        });
        setClasses(classes.concat(classesToAdd));         
        setAcceptedSearch(acceptedSearchedClasses);
        setIsSuggestionAccepted(true);   
    }

    // Upload Modal

    const closeUploadModal = () => {
        setVisibleUpload(false);
        uploadForm.resetFields();
    }

    const onFinishUpload = () => {
        const filenames = uploadForm.getFieldValue('filenames').fileList.map((file: any) => {
            return file.name
        })

        let aux_files = Array.from(new Set(instance.filenames.concat(filenames)));

        instanceService.editInstances(params.id, {filenames: aux_files}).then((res) => {
            setInstance(res.data.instance);
            message.success(res.data.successful)
        }).catch(err => message.error(err.toString()))
        closeUploadModal()
    }

    // File
    const removeFile = (item: any) => {
        let filename_list = instance.filenames;
        const index = filename_list.indexOf(item);

        // Local Changes
        if (index >= 0 && filename_list.length > 1) {
            filename_list.splice(index, 1);
            setInstance({...instance, filenames: filename_list})
            instanceService.editInstances(params.id, {filenames: filename_list}).catch((err) => {
                message.error(err.data().error);
            })
        }
    }

    const downloadFiles = () => {    
        instance.filenames.map((i: string) => {
            fileService.download(i).then((res) => {
                fileDownload(res.data, i)
                fileService.getInferences(i).then((inferenceRes) => {
                    console.log(inferenceRes);
                })
            }).catch((err) => {
                message.error(err.toString())
            })
        })
    }

    const prepareDuplicateMapping = (value: string) =>{
        setDuplicatedModalOpen(true);
        setDuplicatedSelectedClass(value);
        setHandleDuplicatedModalCaller("mapping");
    }

    const prepareDuplicateRemove = (value: string) =>{
        setDuplicatedModalOpen(true);
        setDuplicatedSelectedClass(value);
        setHandleDuplicatedModalCaller("delete");
    }

    // Mapping

    const startMapping = (_class: string, duplicatedIndex: number) => {       
        const mappingElement = instance['mapping'][_class];
        //If the class is currently duplicated.
        let mapping = mappingElement;      
        if(Array.isArray(mappingElement)){
            mapping = mappingElement[duplicatedIndex];
        }
        navigate('mapping', {
            state: {
                _id: params.id,
                _duplicated_id: duplicatedIndex,
                _class: _class,
                subject: (!instance['suggest_ontology']) ? mapping.subject: '',
                current_file: (!instance['suggest_ontology']) ? mapping.fileSelected: instance['filenames'][0],
                files: instance.filenames.map((i: any) => {
                    return {value: i, label: i}
                })
            }
        });
    }

    // Duplication

        const handleDuplicatedModal = () =>{          
            if(handleDuplicatedModalCaller === "mapping"){
                startMapping(duplicatedSelectedClass, duplicatedSelectedIndex);
                setDuplicatedSelectedClass('');
                setDuplicatedSelectedIndex(-1);
            }
            else if(handleDuplicatedModalCaller === "delete"){
                startRemoval(duplicatedSelectedClass, duplicatedSelectedIndex);
                setDuplicatedSelectedClass('');
                setDuplicatedSelectedIndex(-1);
            }
            setDuplicatedModalOpen(false);
        }

        const getDuplicatedElements = () =>{
            const listOfDuplications: { value: number; label: number; }[] = []; 
            if (duplicatedSelectedClass.length > 0){
                instance['mapping'][duplicatedSelectedClass].map((element: any, i: number) => listOfDuplications.push({value: i, label: i}));
            }         
            return listOfDuplications;            
        }

        const startDuplication = (_class: string, index: number, record: any) => {
            const mappingElement = instance['mapping'][_class];
            const newInstance = structuredClone(instance);

            //If the class is currently duplicated.
            if(Array.isArray(mappingElement)){     
                const newMappingElement = structuredClone(instance['mapping'][_class][0]);  
                newMappingElement.columns = {};
                newMappingElement.subject = undefined;  
                newInstance['mapping'][_class].push(newMappingElement);
            }else{ // Is the first time we duplicated the elemente
                const newMappingElement = structuredClone(mappingElement);
                newMappingElement.columns = {};
                newMappingElement.subject = undefined;  
                newInstance['mapping'][_class] = [mappingElement, newMappingElement];
            }     
            
            setInstance(newInstance);

            instanceService.editInstances(params.id, {mapping: newInstance['mapping']}).catch(err => message.error(err.toString()));      
        }

        const startRemoval = (_class: string, duplicatedIndex: number) => {
            const mappingElement = instance['mapping'][_class];
            const newInstance = structuredClone(instance);
            if(Array.isArray(mappingElement)){         
                mappingElement.splice(duplicatedIndex, 1);
                if(mappingElement.length === 1){
                    newInstance['mapping'][_class] = mappingElement[0];
                }else{
                    newInstance['mapping'][_class] = mappingElement;
                }                
                setInstance(newInstance);
                instanceService.editInstances(params.id, {mapping: newInstance['mapping']}).catch(err => message.error(err.toString()));
            }    
        }

    const startLink = (relation: any) => {
        navigate('link', {
            state: {
                _id: params.id,
                relation: relation
            }
        })
    }

    const isDuplicated = (_class: any) => {
        const mappingElement = instance['mapping'][_class];
        return Array.isArray(mappingElement);
    }

    const navigateToMapping = () => {
        navigate('csv', {
            state: {
                current_file: instance['filenames'][0]
            }
        })
    }

    const selectRelation = (record: any) => {
        let newInstance = instance;
        newInstance.relations[record.relation].selected = !record['selected']
        //setInstance(newInstance)
        instanceService.editInstances(params.id, {relations: newInstance.relations}).catch(err => message.error(err.toString()))
    }

    const generate = () => {
        mappingService.generateYARRML({_id: params.id, classes: generateConfig}).then((res) => {
            message.success("The YARRRML file has been generated successfully.")
            fileDownload(res.data.yaml, `${params.id}.yaml`)
        }).catch(err => message.error(err.toString()))
    }

    const preview = () => {
        navigate("preview", {
                state: {
                    instance: instance,
                    relations: relations
                }
            }
        )
    }

    // Search Functions
    const handleClassSearch = (value: string) => {
        value === '' ? setClassSearch(instance.classes_to_map) : setClassSearch(instance.classes_to_map.filter((i: any) => i.includes(value)))
    }

    const handleRelationSearch = (value: string) => {
        value === '' ? setRelationSearch(relations) : setRelationSearch(relations.filter((i: any) => i.relation.includes(value)))
    }

    // Add and clean functions

    const addAll = () => {
        let all = classes.map((i: any) => {
            return i.value
        })
        classesForm.setFieldsValue({select: all})
    }

    const undo = () => {
        classesForm.setFieldsValue({select: instance.classes_to_map})

    }

    const cleanAll = () => {
        classesForm.resetFields(['select']);
        setDataRepository([]);
    }

    const cleanList = () => {
        setDataRepository([]);
        setIsSearchFinished(false);
        setIsSearchStarted(false);
    }

    const searchClasses = (event: any) => {
        const textToSearch = event.target.value;        
        
        suggestionService.getSuggestedClasses(textToSearch).then((res) => {
            const results = res.data.results;
            const listOfSuggestions: Array<{}> = [];

            Array.prototype.forEach.call(results, element => {
                const name = element['prefixedName'][0];
                const ontoName = name.split(':')[0];
                const className = name.split(':')[1];
                const labelText = className + " (Ontology: "+ ontoName +")";
                listOfSuggestions.push({value:ontoName, label:labelText})           
              });    
       
            setSearchedClasses(listOfSuggestions);                 
        });
    }

    const suggest = (isClass: boolean, valueToSearch: string) => {       
        const serviceCaller = isClass ? suggestionService.getSuggestedClasses : suggestionService.getSuggestedProperties;

        serviceCaller(valueToSearch).then((res) => {
            const results = res.data.results;
            const listOfSuggestions: Array<{}> = [];

            Array.prototype.forEach.call(results, element => {
                const name = element['prefixedName'][0];
                const ontoName = name.split(':')[0];         
                listOfSuggestions.push({value:ontoName, label:ontoName})           
              });
            if(isClass){
                setSuggestedClasses(suggestedClasses.concat(listOfSuggestions));
            }else{
                setSuggestedProperties(suggestedProperties.concat(listOfSuggestions));
            }            
        });
    }

    const refreshInstance = (idOntology: string) => {        
        instanceService.initInstance(instance._id, {
            ontology_id: idOntology,
            suggest_ontology: false
        }).then(
            () => {
                getInstanceInfo();
            }
        )
    }

    const createRemoteOntologies = () =>{      
        ontologyService.create_ontology_from_remote_source(acceptedSearch).then(
            (response: any) => {       
                if (response.status === 200){
                    const idOntology = response.data.id;  
                    instanceService.editInstances(instance._id, {
                        current_ontology: idOntology,
                        suggest_ontology: false
                    }).then(
                        (response) => {                       
                            setInstance(response.data.instance); 
                            refreshInstance(idOntology);
                        }
                    )        
                    
                    setIsOntologyReady(true);     
                }else{
                    message.error("There was an error parsing the ontology selected.");
                }           
            }
        ).catch((err) => {
            message.error(err.toString())
        });  
    }

    const dataverseSearch = () => {
        const filter = 'csv';  
        setIsSearchStarted(true);    

        dataverseService.exploreDataverse(
            dataVerseSearchForm.getFieldValue('dataverse_url'),
            dataVerseSearchForm.getFieldValue('repository_name'),
            filter
        ).then((res) => {          
            setIsSearchStarted(false);
            setIsSearchFinished(true);
            setDataRepository(dataRepository.concat(res.data.datafiles));   
        }).catch((err) => {
            message.error(err.toString())
        });
    }

    return (<>
        {/* Classes Modal */}
        
        {!instance.suggest_ontology?
        <Modal visible={visibleClasses} onCancel={closeClasses} onOk={classesForm.submit} width={"50%"}>
            <Form layout={"vertical"} form={classesForm} onFinish={onFinishClasses}>
                <Form.Item name={"select"} label={"Classes"} rules={[{required: true}]}>
                    <Select mode="multiple"                      
                            placeholder="Select the class/es that you would like to map."
                            options={filteredList(classes)}/>
                </Form.Item>   
            </Form>
            <Divider/>
            <Space size={"middle"}>
                <Tooltip title={"Add All"} placement={"bottom"}><Button onClick={addAll} shape={"circle"}
                                                                        icon={<PlusOutlined/>}/></Tooltip>
                <Tooltip title={"Clean All"} placement={"bottom"}><Button onClick={cleanAll} shape={"circle"}
                                                                          icon={<ClearOutlined/>}/>
                </Tooltip>
                <Tooltip title={"Undo All"} placement={"bottom"}><Button onClick={undo} shape={"circle"}
                                                                         icon={<RollbackOutlined/>}/></Tooltip>
            </Space>

        </Modal>
        :
        <Modal visible={visibleClasses} onCancel={closeClasses} onOk={classesForm.submit} width={"50%"}>           
            <Form layout={"vertical"} form={classesForm} onFinish={onFinishClasses}>     
                <label>Suggested Ontologies according the name of your files.</label>
                <Select disabled={!isAutossugest || isSuggestionAccepted}   
                    allowClear style={{ width: '100%' }} 
                    defaultActiveFirstOption={true}
                    placeholder="Classs suggestions" 
                    onChange={handleSuggestedClasses}
                    options={suggestedClasses}>               
                </Select>
                <Button onClick={acceptSuggestions} disabled={isSuggestionAccepted || acceptedSuggestedClasses === ""}>Accept suggestion</Button> 
                <br/>
                <label>Or search classes to extract an ontology</label> 
                <Input disabled={isSuggestionAccepted} onChange={searchClasses} placeholder="Type the name of a class to find suitable ontologies"></Input>
                <Select
                    disabled={isSuggestionAccepted}                                  
                    allowClear style={{ width: '100%' }}                     
                    placeholder="Classs suggestions"                  
                    onChange={handleSearchedClasses}
                    options={searchedClasses}>               
                </Select>
                <Button onClick={acceptSearch} disabled={isSuggestionAccepted || acceptedSearchedClasses === ""}>Accept selection</Button>  
                <br/>
                <label>Accepted class: {acceptedSearch}</label> 
                <br/>
                <Button onClick={(e) => {createRemoteOntologies();}} disabled={!isSuggestionAccepted || isOntologyReady}>Create ontologies from remote sources</Button>                  
                <br/>
                <Form.Item name={"select"} label={"Classes"} rules={[{required: true}]}>
                    <Select disabled={!isOntologyReady}
                            mode="multiple"                                                  
                            placeholder="Select the class/es that you would like to map."
                            options={filteredList(classes)}/>
                </Form.Item>                   
            </Form>    
            <Divider/>
            <Space size={"middle"}>
                <Tooltip title={"Add All"} placement={"bottom"}><Button disabled={!isOntologyReady} onClick={addAll} shape={"circle"}
                                                                        icon={<PlusOutlined/>}/></Tooltip>
                <Tooltip title={"Clean All"} placement={"bottom"}><Button disabled={!isOntologyReady} onClick={cleanAll} shape={"circle"}
                                                                          icon={<ClearOutlined/>}/>
                </Tooltip>
                <Tooltip title={"Undo All"} placement={"bottom"}><Button disabled={!isOntologyReady} onClick={undo} shape={"circle"}
                                                                         icon={<RollbackOutlined/>}/></Tooltip>
            </Space>
        </Modal>
        }
        {/* Edit Instance Modal */}

        <Modal
            width={"100vh"}
            visible={visibleEditInstance}
            title="Create Instance"
            onCancel={closeEditInstance}
            onOk={editForm.submit}>

            <Form form={editForm} layout={"vertical"}
                  initialValues={{
                      name: instance.name,
                      description: instance.description,
                      current_ontology: currentOntology?.value
                  }}
                  onFinish={onFinishEditInstance}>
                <Row>
                    <Col span={10}>
                        <Form.Item name={"name"} label={"Name"} rules={[{required: true}]}>
                            <Input placeholder={"Instance Name"}/>
                        </Form.Item>
                        <Form.Item name={"current_ontology"} label={"Ontology"} rules={[{required: false}]}>
                            <Select options={ontologies}
                                    onChange={(value, option: any) => {
                                        getOntologyInUse(value)
                                        instanceService.initInstance(params.id, {ontology_id: value}).then(() => {
                                            setClassSearch([]);
                                            getClasses(value);
                                            setRelationSearch([]);
                                            getRelations({...instance, current_ontology: value});
                                        }).catch(err => message.error(err.toString()));
                                    }
                                    }/>
                        </Form.Item>
                    </Col>
                    <Col span={2}/>
                    <Col span={10}>
                        <Form.Item name={"description"} label={"Description"}>
                            <Input.TextArea showCount maxLength={280}/>
                        </Form.Item>
                    </Col>
                </Row>
            </Form>
        </Modal>

        <Modal width={"80vh"} visible={visibleUpload}
               onCancel={closeUploadModal}
               onOk={uploadForm.submit}>
            <Tabs >
                <Tabs.TabPane tab="Upload from computer" key="item-1">
                    <Form form={uploadForm} layout={"vertical"} onFinish={onFinishUpload}>
                        <Form.Item name={"filenames"}>
                            <Dragger
                                style={{marginTop: "2vh"}}
                                accept={".csv"}
                                action={configService.api_url + "/files/upload"}
                                headers={{Authorization: "Bearer " + authService.hasCredentials()}}
                                onChange={onChangeDragger}
                                beforeUpload={file => {
                                    const reader = new FileReader();

                                    reader.onload = (e: any) => {
                                        console.log(e.target.result);
                                    };
                                    reader.readAsText(file);

                                    // Prevent upload
                                    return false;
                                }}>
                                <p className="ant-upload-drag-icon">
                                    <InboxOutlined/>
                                </p>
                                <p className="ant-upload-text">Click or drag file to this area to upload</p>
                                <p className="ant-upload-hint">
                                    Support for a single or bulk upload. Strictly prohibit from uploading company
                                    data or other
                                    band files.
                                </p>
                            </Dragger>
                        </Form.Item>
                    </Form>
                </Tabs.TabPane>
                <Tabs.TabPane tab="Download from Dataverse" key="item-2">
                            <Form form={dataVerseSearchForm} layout={"vertical"} onFinish={dataverseSearch}>
                                <Row>
                                    <Col span={50}>
                                        <Form.Item name={"dataverse_url"} label={"Dataverse Url"} rules={[{required: true}]} hasFeedback>
                                            <Input                  
                                                onKeyUp={() => cleanList()}                                        
                                                placeholder="https://dataverse.csuc.cat" 
                                                id="dataverseUrl"                                      
                                                />
                                        </Form.Item>
                                    </Col>
                                </Row>
                                <Row>
                                    <Col span={10}>
                                        <Form.Item name={"repository_name"} label={"Dataverse name"} rules={[{required: true}]} hasFeedback>
                                            <Input
                                             onKeyUp={() => cleanList()}    
                                             placeholder="udl" 
                                             id="repositoryName"/>
                                        </Form.Item>
                                    </Col>
                                </Row>
                                <Row>
                                    <Col span={10}>
                                        <Button type="primary" disabled={isSearchStarted} icon={<SearchOutlined />} onClick={() => {dataverseSearch()}}>
                                            Search
                                        </Button>
                                    </Col>
                                </Row>
                            </Form>
                            {dataRepository.length > 0?
                            <List>
                                <VirtualList
                                    data={dataRepository}
                                    height={200}
                                    itemHeight={47}
                                    itemKey="datafile_id"                
                                >
                                    {(item: DataVerseSpace) => (
                                    <List.Item onClick={() => {selectedRepositoryFile(item.datafile_id, item.filename)}}
                                        key={item.datafile_id}
                                        id={item.datafile_id}
                                        >
                                        <List.Item.Meta                                       
                                        title={item.filename}                                                                    
                                        />                                   
                                    </List.Item>
                                    )}
                                </VirtualList>
                            </List>
                            :<span></span> }
                            {
                                isSearchFinished?<div>No .csv files found </div>:<div></div>
                            }
                </Tabs.TabPane>
            </Tabs>

        </Modal>

        {/* Content */}
        <Row justify="center" style={{marginBottom: "3vh"}}>
            {/* <Button onClick={navigateToMapping}>Annotate csv file</Button> */}
        </Row>  
        <Row>
            <Col span={1}/>
            <Col span={10}>                
                <h3><b>Classes</b></h3>
                <Table bordered rowKey={(record) => {
                    return record
                }} size={"small"} pagination={{pageSize: 5}} dataSource={classSearch}
                       loading={loading.instances}>
                    <Column title={"Class"}
                            sortDirections={['descend', 'ascend']}
                            sorter={{compare: (a: any, b: any) => alphabeticalSort(a, b)}}
                            filterIcon={() => <SearchOutlined/>}
                            filterDropdown={() => {
                                return (
                                    <div style={{padding: 8}}>
                                        <Input.Search
                                            allowClear={true}
                                            defaultValue={""}
                                            onSearch={i => handleClassSearch(i)}
                                            placeholder={`Search Class`}
                                            style={{marginBottom: 8, display: 'block'}}
                                        />
                                    </div>
                                );
                            }}
                    />
                    <Column align={"center"} title={"Actions"} render={(value, record, index) => {
                        return <Space>
                                        <Tooltip title={"Map"} placement={"bottom"}><Button size={"small"}
                                                                                          shape={"circle"}
                                                                                          icon={<AppstoreAddOutlined/>}
                                                                                          onClick={() => isDuplicated(value)?prepareDuplicateMapping(value):startMapping(value,-1)}/>
                                        </Tooltip>
                                        <Tooltip title={"Duplicate"} placement={"bottom"}><Button size={"small"}
                                                                                          shape={"circle"}
                                                                                          icon={<PlusOutlined/>}
                                                                                          onClick={() => startDuplication(value, index, record)}/>
                                        </Tooltip>
                                        {
                                            isDuplicated(value) && 
                                            <Tooltip title={"Remove"} placement={"bottom"}><Button size={"small"}
                                                shape={"circle"}
                                                icon={<DeleteOutlined />}
                                                onClick={() => prepareDuplicateRemove(value)}/>
                                            </Tooltip> 
                                        }                                        

                                </Space>
                    }}/>
                </Table>
                <Modal title="Basic Modal" open={duplicatedModalOpen} onOk={handleDuplicatedModal} onCancel={() => {setDuplicatedModalOpen(false);}}>
                    <p>There are more than one mapping for this class. Please, select which one do you want to remove</p>
                    <Select defaultValue={0} options={getDuplicatedElements()} onChange = {(e) => {setDuplicatedSelectedIndex(e)}}/>                    
                </Modal>
                <Divider/>
                <h3><b>Link</b></h3>
                <Table bordered size={"small"} pagination={{pageSize: 5}} dataSource={relationSearch}
                       loading={loading.instances}>
                    <Column title={"Relation"} dataIndex={"relation"}

                            sortDirections={['descend', 'ascend']}
                            sorter={{
                                compare: (a: any, b: any) => alphabeticalSort(a.relation, b.relation),
                                multiple: 2
                            }}
                            filterIcon={() => <SearchOutlined/>}
                            filterDropdown={() => {
                                return (
                                    <div style={{padding: 8}}>
                                        <Input.Search
                                            allowClear={true}
                                            defaultValue={""}
                                            onSearch={i => handleRelationSearch(i)}
                                            placeholder={`Search Relation`}
                                            style={{marginBottom: 8, display: 'block'}}
                                        />
                                    </div>
                                );
                            }}
                    />
                    <Column title={"Selected"} dataIndex={"selected"} align={"center"} key={"selected"}
                            sortDirections={['descend', 'ascend']}
                            filters={[{text: "Selected", value: true}, {text: "Unselected", value: false}]}
                            onFilter={((value, record) => record.selected === value)}

                            sorter={{
                                compare: (a: any, b: any) => alphabeticalSort(a.selected.toString(), b.selected.toString()),
                                multiple: 2
                            }}

                            render={((value, record) => {
                                return <><Switch checked={value} checkedChildren={<CheckOutlined/>}
                                                 unCheckedChildren={<CloseOutlined/>} onChange={() => {
                                    selectRelation(record)
                                }}/></>
                            })
                            }/>
                    <Column title={"Actions"} align={"center"} render={((value, record) => {
                        return <Space>
                                    <Tooltip title={"Link"} placement={"bottom"}>
                                        <Button size={"small"} shape={"circle"} icon={<LinkOutlined/>}
                                                onClick={() => {
                                                    startLink(record)
                                                }}/>
                                    </Tooltip>                                    
                                </Space>
                    })
                    }/>
                </Table>
            </Col>
            <Col span={2} style={{paddingLeft: "2%"}}>
                <Row>
                    <Button type={"primary"} shape="circle" icon={<DownOutlined/>} onClick={showClasses}/>
                </Row> 
            </Col>
            <Col span={10}>
                <Card size={"small"} loading={loading.instances} title={"Ref.: " + params.id}
                      actions={[
                          <Tooltip title={"Edit"} placement={"bottom"}><SettingOutlined onClick={showEditInstance}
                                                                                        key="setting"/></Tooltip>,
                          <Tooltip title={"Upload"} placement={"bottom"}><CloudUploadOutlined onClick={() => {
                              setVisibleUpload(true)
                          }} key={"upload"}/></Tooltip>,
                          <Tooltip title={"Download"} placement={"bottom"}><CloudDownloadOutlined
                              onClick={downloadFiles}
                              key={"download"}/></Tooltip>]}>
                    <Meta title={<b>{instance.name}</b>} description={instance.description}/>
                    <div style={{marginTop: "1%"}}>
                        <h6><b>Created At:</b> {instance.createdAt}</h6>
                        <h4><Tag color={"green"}
                                 key={currentOntology?.value}>{currentOntology?.label}</Tag></h4>
                        <Progress percent={instance.status} strokeColor="#52c41a"/>

                        <Row justify={"center"} gutter={10} style={{alignItems: "center"}}>
                            <Col span={23}>
                                <Card size={"small"} style={{marginTop: "1%"}} loading={loading.instances}>
                                    {instance.filenames?.map((i: any) => {
                                        return <Tag closable={instance.filenames.length > 1 && !lock} onClose={() => {
                                            removeFile(i)
                                        }} key={i} color={"blue"}>{i}</Tag>
                                    })}
                                </Card>
                            </Col>
                            <Col span={1}>
                                <Button type={"text"} icon={lock ? <LockOutlined/> : <UnlockOutlined/>} onClick={() => {
                                    setLock(!lock)
                                }}/>
                            </Col>
                        </Row>
                    </div>
                </Card>
                <Divider/>
                <Card title={"Generate YARRRML"} actions={[

                    <Tooltip title={"Preview"} placement={"bottom"}> <FileSearchOutlined key={"preview"}
                                                                                         onClick={preview}/></Tooltip>,
                    <Tooltip title={"Run"} placement={"bottom"}><CaretRightOutlined key="run" style={{color: "green"}}
                                                                                    onClick={generate}/></Tooltip>
                ]}>
                    <Row>
                        <Col span={24}>
                            <Select mode={"multiple"} loading={loading.instances} showSearch options={generateOptions}
                                    style={{minWidth: "100%"}}
                                    value={generateConfig} onChange={(value) => {
                                setGenerateConfig(value)
                            }}/>
                        </Col>
                    </Row>
                </Card>
            </Col>
            <Col span={1}/>
        </Row>

    </>)

}
export default InstanceDetailPage;