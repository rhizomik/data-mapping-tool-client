import React, {Fragment, useEffect, useState} from "react";
import {
    Button,
    Col,
    Form,
    Input,
    message,
    Modal,
    Popconfirm,
    Progress,
    Row,
    Select,
    Space,
    Table, Tag,
    Tabs,
    Tooltip,
    Upload,
    Checkbox
} from "antd";
import {
    BuildOutlined,
    DeleteOutlined,
    DownloadOutlined,
    InboxOutlined,
    PlusOutlined,
    QuestionCircleOutlined,
    SearchOutlined
} from '@ant-design/icons';
import {useNavigate} from "react-router-dom";
import {alphabeticalSort, integerSort} from "../utils/sorter";
import AuthService from "../services/AuthService";
import ConfigService from "../services/ConfigService";
import InstanceService from "../services/InstanceService";
import {useForm} from "antd/es/form/Form";
import OntologyService from "../services/OntologyService";
import fileDownload from "js-file-download";
import SearchDataverse from "../parts/SearchDataverse";

const {Dragger} = Upload;

const {Column} = Table;

const MyInstancesPage = () => {
    const configService = new ConfigService().getConfig()
    const authService = new AuthService()
    const instanceService = new InstanceService();
    const ontologyService = new OntologyService();
    const navigate = useNavigate();

    const [data, setData] = useState<any>([]);
    const [dataSource, setDataSource] = useState<any>([]);
    const [ontologies, setOntologies] = useState<any>([]);
    const [dataSourceLoading, setDataSourceLoading] = useState(false);
    const [searchInput] = useState("");
    const [visible, setVisible] = useState(false);
    const [isSuggestion, setSuggestion] = useState(false);
    const [dataSourceFileName, setDataSourceFileName] = useState('');


    // Form
    const [form] = useForm();

    const onFinish = (values: any) => {
        if(dataSourceFileName.length > 0){
            values['filenames'] = [dataSourceFileName];
        }else{
            values['filenames'] = values.upload_file.fileList.map((i: any) => {
                return i.name
            });
            delete values.upload_file;
        }

        
        values['suggest_ontology'] = isSuggestion;
        instanceService.createInstances(values).then((res) => {
            const instance = res.data.instance
            instanceService.initInstance(instance._id, {
                ontology_id: instance.current_ontology,
                suggest_ontology: isSuggestion
            }).catch(err => message.error(err.toString()));
            gatherInstances();
            closeModal();
            message.success("The instances has been created successfully.")
        }).catch((err: any) => {
            message.error(err.toString())
        })
    }
    const gatherOntologies = () => {
        ontologyService.getOntologies().then((res) => {
            setOntologies(res.data.data.map((i: any) => {
                return {label: i.ontology_name, value: i._id}
            }))
        }).catch(err => message.error(err.toString()))
    }

    // Gather Data
    useEffect(() => {
        gatherInstances()
        gatherOntologies()
    }, [])

    const gatherInstances = () => {
        setDataSourceLoading(true);
        instanceService.getInstances().then((res) => {
            let _data = res.data["data"].map((i: any, index: number) => {
                i['key'] = i['_id']
                i['index'] = index
                return i
            });
            setData(_data);
            setDataSource(_data);
            setDataSourceLoading(false);
        }).catch((err) => {
            message.error(err.toString())
            setDataSourceLoading(false);
        });
    }

    // Modal

    const showModal = () => {
        setVisible(true);
    }

    const closeModal = () => {
        setVisible(false);
        form.resetFields();
    }


    const mapping = (id: string) => {
        navigate(id)
    }

    const deleteInstance = (id: string) => {
        instanceService.removeInstance(id).then((res) => {
            message.success("The " + id + "has been deleted successfully.")
        }).catch((err) => {
            message.error(err.toString())
        });
        setDataSource(dataSource.filter((i: any) => i['_id'] !== id))
    }

    const downloadInstance = (id: string) => {
        instanceService.getInstance(id).then((res) => {
            fileDownload(JSON.stringify(res.data.data), `${id}.json`)
        })
    }

    const handleSearch = (value: string, property: string) => {
        value === '' ? setDataSource(data) : setDataSource(data.filter((i: any) => i[property].includes(value)))
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

    const isSuggest = (e:any) => {
        setSuggestion(e.target.checked);  
    }

    const notifyDataverseSelectedFile = (file:string) => {
        setDataSourceFileName(file);
    }

    return (<Fragment>

            <Modal
                width={"100vh"}
                visible={visible}
                title="Create Instance"
                onCancel={closeModal}
                onOk={form.submit}>

                <Form form={form} layout={"vertical"} onFinish={onFinish}>
                    <Row>
                        <Col span={10}>
                            <Form.Item name={"name"} label={"Name"} rules={[{required: true}]} hasFeedback>
                                <Input placeholder={"Instance Name"}/>
                            </Form.Item>

                            <Form.Item name={"description"} label={"Description"}>
                                <Input.TextArea showCount maxLength={280}/>
                            </Form.Item>
                            <Form.Item name={"suggest_ontology"} label={"LinkedData"} hasFeedback>                                
                                <Checkbox onChange={isSuggest}/>
                                <label> Suggest ontologies from LinkedData</label>
                            </Form.Item>                            
                            <Form.Item name={"current_ontology"}                                         
                                        label={"Ontology"} 
                                        rules={[{required: false}]}
                                       hasFeedback>
                                <Select disabled={isSuggestion} loading={ontologies.length === 0} options={ontologies}>
                                </Select>
                            </Form.Item>

                        </Col>
                        <Col span={2}/>
                        <Col span={10}>
                            <Tabs >
                            <Tabs.TabPane tab="Upload from computer" key="item-1">
                                <Form.Item name={"upload_file"} label={"Upload Data"} rules={[{required: false}]}>
                                    <Dragger accept={".csv"}
                                            action={configService.api_url + "/files/upload"}
                                            headers={{Authorization: "Bearer " + authService.hasCredentials()}}
                                            onChange={onChangeDragger}>
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
                        </Tabs.TabPane>
                        <Tabs.TabPane tab="Download from Dataverse" key="item-2">
                            <SearchDataverse onSelectedFile={notifyDataverseSelectedFile}></SearchDataverse>
                        </Tabs.TabPane>
                        </Tabs>
                        </Col>
                    </Row>
                </Form>
            </Modal>

            <Row>
                <Col span={23}/>
                <Col span={1}>
                    <Button type={"primary"} shape="circle" icon={<PlusOutlined/>} onClick={showModal}/>
                </Col>
            </Row>
            <Row style={{marginTop: "3vh"}}>
                <Col span={24}>
                    <Table size={"middle"} dataSource={dataSource}
                           loading={dataSourceLoading}
                           pagination={{defaultPageSize: 10, showSizeChanger: true, pageSizeOptions: [5, 10]}}
                           bordered={true}
                           scroll={{x: 1300}}>1
                        <Column align={"center"} title="ID." dataIndex="_id" key="id"
                                sortDirections={['descend', 'ascend']}
                                sorter={{compare: (a: any, b: any) => alphabeticalSort(a._id, b._id), multiple: 3}}
                                filterIcon={() => <SearchOutlined/>}
                                filterDropdown={() => {
                                    return (
                                        <div style={{padding: 8}}>
                                            <Input.Search
                                                allowClear={true}
                                                onSearch={id => handleSearch(id, "_id")}
                                                defaultValue={searchInput}
                                                placeholder={`Search Reference`}
                                                style={{marginBottom: 8, display: 'block'}}
                                            />
                                        </div>
                                    );
                                }}
                        />
                        <Column align={"center"} title="Ontology" dataIndex="current_ontology" key="current_ontology"
                                sortDirections={['descend', 'ascend']}
                                render={(value, record, index) => {
                                    let aux = ontologies.find((element: any) => element.value === value)
                                    return <Tag color={"green"}>{aux?.label}</Tag>
                                }}
                        />
                        <Column align={"center"} title="Name." dataIndex="name" key="name"
                                sortDirections={['descend', 'ascend']}
                                sorter={{compare: (a: any, b: any) => alphabeticalSort(a._id, b._id), multiple: 3}}
                                filterIcon={() => <SearchOutlined/>}
                                filterDropdown={() => {
                                    return (
                                        <div style={{padding: 8}}>
                                            <Input.Search
                                                allowClear={true}
                                                onSearch={i => handleSearch(i, 'name')}
                                                defaultValue={searchInput}
                                                placeholder={`Search ID`}
                                                style={{marginBottom: 8, display: 'block'}}
                                            />
                                        </div>
                                    );
                                }}/>
                        <Column align={"center"} title="Status" dataIndex="status" key="status"
                                render={(i) => {
                                    return (
                                        <Fragment>
                                            <Progress percent={i} steps={5} size="small" strokeColor="#52c41a"/>
                                        </Fragment>
                                    )
                                }}
                                sortDirections={['descend', 'ascend']}
                                sorter={{
                                    compare: (a: any, b: any) => integerSort(a.status, b.status),
                                    multiple: 3
                                }}/>
                        <Column align={"center"} title="Actions" fixed={"right"}
                                render={(i) => (
                                    <Fragment>
                                        <Space size={"large"}>

                                            <Tooltip title="Mapping">
                                                <Button shape="circle" icon={<BuildOutlined/>} onClick={() => {
                                                    mapping(i['_id']);
                                                }}/>
                                            </Tooltip>

                                            <Popconfirm title="Are you sure？" onConfirm={() => {
                                                deleteInstance(i['_id'])
                                            }}
                                                        icon={<QuestionCircleOutlined style={{color: 'red'}}/>}>
                                                <a href="#"><Button shape="circle" icon={<DeleteOutlined/>}/></a>
                                            </Popconfirm>

                                            <Tooltip title="Download">
                                                <Button shape="circle" icon={<DownloadOutlined/>} onClick={() => {
                                                    downloadInstance(i['_id'])
                                                }}/>
                                            </Tooltip>
                                        </Space>
                                    </Fragment>)}/>
                    </Table>
                </Col>
            </Row>
        </Fragment>
    )

}

export default MyInstancesPage;


