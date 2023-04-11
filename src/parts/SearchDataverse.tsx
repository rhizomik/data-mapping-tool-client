import { Button, Col, Form, Input, List, message, Row } from "antd";
import { useForm } from "antd/lib/form/Form";
import { useState } from "react";
import DataVerseSpace from "../interfaces/Dataverse-space.interface";
import DataverseService from "../services/DataverseService";

import VirtualList from 'rc-virtual-list';
import { SearchOutlined } from "@ant-design/icons";
import InstanceService from "../services/InstanceService";
import { useParams } from "react-router-dom";

const SearchDataverse = (props: any) => {
    const [form] = useForm();
    const params = useParams();
    const instanceService = new InstanceService();
    const [instance, setInstance] = useState<any>({});
    const [isSearchStarted,setIsSearchStarted] = useState<boolean>();
    const [isSearchFinished,setIsSearchFinished] = useState<boolean>();
    const dataverseService = new DataverseService();
    const [dataRepository, setDataRepository] = useState<DataVerseSpace[]>([]);
    const [visibleUpload, setVisibleUpload] = useState(false);

    const dataverseSearch = () => {
        const filter = 'csv';  
        setIsSearchStarted(true);    

        dataverseService.exploreDataverse(
            form.getFieldValue('dataverse_url'),
            form.getFieldValue('repository_name'),
            filter
        ).then((res) => {          
            setIsSearchStarted(false);
            setIsSearchFinished(true);
            setDataRepository(dataRepository.concat(res.data.datafiles));   
        }).catch((err) => {
            message.error(err.toString())
        });
    }


    const cleanList = () => {
        setDataRepository([]);
        setIsSearchFinished(false);
        setIsSearchStarted(false);
    }

    const selectedRepositoryFile = (idFile: string, filename: string) => { 
        dataverseService.registerFileFromRepository(
            form.getFieldValue('dataverse_url'),
            form.getFieldValue('repository_name'),
            idFile
            ).then((res) => {        
                props.onSelectedFile(filename);
                // let aux_files = Array.from(new Set(instance.filenames.concat([filename])));

                // instanceService.editInstances(params.id, {filenames: aux_files}).then((res) => {
                //     setInstance(res.data.instance);
                //     message.success(res.data.successful)
                // }).catch(err => message.error(err.toString()))      
                
            });       
        }

    const checkPreSearch = () => {
        const dataverse_url: string = form.getFieldValue('dataverse_url');
        const repository_name: string  = form.getFieldValue('repository_name');

        return dataverse_url.length > 0 && repository_name.length > 0;
    }

    return(
        <div>

        <Form form={form} layout={"vertical"} onFinish={dataverseSearch}>
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
                <Button type="primary" disabled={isSearchStarted} icon={<SearchOutlined />} onClick={() => {checkPreSearch()?dataverseSearch():message.error("Please, fill the required information.")}}>
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
        </div>
    )
}

export default SearchDataverse;
