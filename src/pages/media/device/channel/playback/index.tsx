import React, { useEffect, useState } from "react";
import { Calendar, Card, Col, List, message, Modal, Row, Select, Spin } from "antd";
import Progress from './Progress'
import Service from '../../service'
import moment, { Moment } from "moment";

interface Props {
    data: any;
    close: Function,
    ok: Function
}

const Playback = (props: Props) => {
    const service = new Service('media/channel');
    const token = localStorage.getItem('x-access-token')
    const [spinning, setSpinning] = useState<boolean>(true);
    const [type, setType] = useState<'local' | 'server'>('local');
    const [url, setUrl] = useState('');
    const [bloading, setBloading] = useState(true);
    const [localVideoList, setLocalVideoList] = useState([])
    const [dateTime, setDateTime] = useState<Moment>(moment())
    const [playing, setPlaying] = useState<boolean>(false)
    const [filesList, setFilesList] = useState<any[]>([])
    const getLocalTime = (dateTime: Moment) => {
        setSpinning(true)
        const start = moment(dateTime).startOf('day').format('YYYY-MM-DD HH:mm:ss')
        const end = moment(dateTime).endOf('day').format('YYYY-MM-DD HH:mm:ss')
        service.getLocalVideoList(props.data.deviceId, props.data.channelId, {
            startTime: start,
            endTime: end
        }).subscribe(resp => {
            setSpinning(false)
            if (resp.status === 200) {
                setLocalVideoList(resp.result)
                service.getAlreadyServerVideoList(props.data.deviceId, props.data.channelId, {
                    startTime: start,
                    endTime: end,
                    includeFiles: false
                }).subscribe(response => {
                    if(response.status === 200){
                        setFilesList(response.result)
                    }
                })
            }
        })
    }
    const getServerTime = (dateTime: Moment) => {
        setSpinning(true)
        service.getServerVideoList(props.data.deviceId, props.data.channelId, {
            startTime: moment(dateTime).startOf('day').format('YYYY-MM-DD HH:mm:ss'),
            endTime: moment(dateTime).endOf('day').format('YYYY-MM-DD HH:mm:ss'),
            includeFiles: true
        }).subscribe(resp => {
            setSpinning(false)
            if (resp.status === 200) {
                setLocalVideoList(resp.result)
            }
        })
    }

    useEffect(() => {
        getLocalTime(dateTime)
    }, []);

    const timeupdate = () => {
        setPlaying(true)
    }
    const endPlay = () => {
        setPlaying(false)
    }

    useEffect(() => {
        const player = document.getElementById('player')
        if (player && url !== '') {
            player.addEventListener('ended', endPlay)
            player.addEventListener('timeupdate', timeupdate)
        }
        return () => {
            player && player.removeEventListener('ended', endPlay)
            player && player.removeEventListener('timeupdate', timeupdate)
        }
    }, [url])

    return (
        <Modal
            visible
            width={1200}
            title="视频回放"
            onCancel={() => { props.close(); }}
            onOk={() => {
                props.ok();
            }}
        >
            <div style={{ display: 'flex', justifyContent: 'space-around' }}>
                <div style={{ width: 800, borderRadius: 4 }}>
                    <div style={{ width: '100%', height: '450px' }}>
                        <live-player live={type === 'local'} id="player" muted fluent loading={bloading} autoplay={true} protocol={'mp4'} video-url={url}></live-player>
                        {/* <easy-player muted fluent loading={bloading} autoplay live protocol={protocol} video-url={url}></easy-player> */}
                    </div>
                    <Progress
                        type={type}
                        dateTime={dateTime}
                        data={localVideoList}
                        playing={playing}
                        play={(data: any) => {
                            setBloading(false)
                            setPlaying(false)
                            if (data) {
                                if (type === 'local') {
                                    setUrl(`/jetlinks/media/device/${props.data.deviceId}/${props.data.channelId}/playback.mp4?:X_Access_Token=${token}&startTime=${moment(data.start).format('YYYY-MM-DD HH:mm:ss')}&endTime=${moment(data.end).format('YYYY-MM-DD HH:mm:ss')}&speed=1`)
                                } else {
                                    setUrl(`/jetlinks/media/record/${data.id}.mp4?:X_Access_Token=${token}`)
                                }
                            }
                        }} />
                </div>
                <div style={{ width: 250 }}>
                    <Spin spinning={spinning}>
                        <Select value={type} style={{ width: '100%', marginBottom: '30px' }} onChange={(value: 'local' | 'server') => {
                            setType(value)
                            setUrl('')
                            setPlaying(false)
                            setBloading(true)
                            if (value === 'server') {
                                getServerTime(dateTime)
                            } else {
                                getLocalTime(dateTime)
                            }
                        }}>
                            <Select.Option value="server">云端</Select.Option>
                            <Select.Option value="local">本地</Select.Option>
                        </Select>
                        <div style={{ width: 250, border: '1px solid #d9d9d9', borderRadius: 4 }}>
                            <Calendar
                                fullscreen={false}
                                headerRender={({ value, type, onChange, onTypeChange }) => {
                                    const start = 0;
                                    const end = 12;
                                    const monthOptions = [];

                                    const current = value.clone();
                                    const localeData = value.localeData();
                                    const months = [];
                                    for (let i = 0; i < 12; i++) {
                                        current.month(i);
                                        months.push(localeData.monthsShort(current));
                                    }

                                    for (let index = start; index < end; index++) {
                                        monthOptions.push(
                                            <Select.Option className="month-item" key={`${index}`}>
                                                {months[index]}
                                            </Select.Option>,
                                        );
                                    }
                                    const month = value.month();

                                    const year = value.year();
                                    const options = [];
                                    for (let i = year - 10; i < year + 10; i += 1) {
                                        options.push(
                                            <Select.Option key={i} value={i} className="year-item">
                                                {i}
                                            </Select.Option>,
                                        );
                                    }
                                    return (
                                        <div style={{ padding: 10 }}>
                                            <Row type="flex" justify="space-between">
                                                <Col>
                                                    <Select
                                                        size="small"
                                                        dropdownMatchSelectWidth={false}
                                                        className="my-year-select"
                                                        onChange={newYear => {
                                                            const now = value.clone().year(newYear);
                                                            onChange(now);
                                                        }}
                                                        value={String(year)}
                                                    >
                                                        {options}
                                                    </Select>
                                                </Col>
                                                <Col>
                                                    <Select
                                                        size="small"
                                                        dropdownMatchSelectWidth={false}
                                                        value={String(month)}
                                                        onChange={selectedMonth => {
                                                            const newValue = value.clone();
                                                            newValue.month(parseInt(selectedMonth, 10));
                                                            onChange(newValue);
                                                        }}
                                                    >
                                                        {monthOptions}
                                                    </Select>
                                                </Col>
                                            </Row>
                                        </div>
                                    );
                                }}
                                onChange={(date: Moment | undefined) => {
                                    if (date) {
                                        setUrl('')
                                        setPlaying(false)
                                        setBloading(true)
                                        setDateTime(date)
                                        if (type === 'server') {
                                            getServerTime(date)
                                        } else {
                                            getLocalTime(date)
                                        }
                                    }
                                }}
                            />
                        </div>
                        <Card style={{ marginTop: '10px', maxHeight: 200, overflowY: 'auto', overflowX: 'hidden' }}>
                            <List
                                size="small"
                                bordered={false}
                                split={false}
                                dataSource={localVideoList}
                                renderItem={(item: any) => <List.Item>
                                    <List.Item.Meta title={type === 'server' ? 
                                    `${moment(item.mediaStartTime).format('HH:mm:ss')} ～ ${moment(item.mediaEndTime).format('HH:mm:ss')}` : 
                                    `${moment(item.startTime).format('HH:mm:ss')} ～ ${moment(item.endTime).format('HH:mm:ss')}`
                                } />
                                    <div><a onClick={() => {
                                        if(type === 'local'){
                                            if(filesList.find(i => item.startTime <= i.streamStartTime && item.endTime >= i.streamEndTime)){
                                                setType('server')
                                                getServerTime(dateTime)
                                                setUrl('')
                                                setPlaying(false)
                                                setBloading(true)
                                            } else {
                                                service.startVideo(props.data.deviceId, props.data.channelId, {
                                                    local: false,
                                                    startTime: item.startTime,
                                                    endTime: item.endTime,
                                                    downloadSpeed: 4
                                                }).subscribe(resp => {
                                                    if (resp.status === 200) {
                                                        message.success('操作成功')
                                                    }
                                                })
                                            }
                                        } else {
                                            window.open(`/media/record/${item.id}.mp4?:X_Access_Token=${token}&download=true`)
                                        }
                                    }}>{type === 'server' ? '下载' : (filesList.find(i => item.startTime <= i.streamStartTime && item.endTime >= i.streamEndTime) ? '查看' : '录像')}</a></div>
                                </List.Item>}
                            />
                        </Card>
                    </Spin>
                </div>
            </div>
        </Modal>
    )
}
export default Playback