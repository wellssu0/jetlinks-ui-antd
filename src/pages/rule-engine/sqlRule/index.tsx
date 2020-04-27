import React, { Fragment, useEffect, useState } from 'react';
import { ColumnProps, PaginationConfig, SorterResult } from 'antd/es/table';
import { Badge, Button, Card, Divider, Form, message, Popconfirm, Table } from 'antd';
import { PageHeaderWrapper } from '@ant-design/pro-layout';
import styles from '@/utils/table.less';
import Search from './search';
import { RuleInstanceItem } from './data.d';
import { Dispatch } from '@/models/connect';
import encodeQueryParam from '@/utils/encodeParam';
import Save from './save/index';
import apis from '@/services';
import { downloadObject } from '@/utils/utils';
import { FormComponentProps } from 'antd/lib/form';
import moment from 'moment';

interface Props extends FormComponentProps {
  dispatch: Dispatch;
  location: Location;
  loading: boolean;
}

interface State {
  data: any;
  searchParam: any;
  saveVisible: boolean;
  current: Partial<RuleInstanceItem>;
}

const SqlRuleList: React.FC<Props> = props => {

  const initState: State = {
    data: [],
    searchParam: { pageSize: 10, terms: { modelType: 'sql_rule' } },
    saveVisible: false,
    current: {},
  };

  const [searchParam, setSearchParam] = useState(initState.searchParam);
  const [saveVisible, setSaveVisible] = useState(initState.saveVisible);
  const [current, setCurrent] = useState(initState.current);
  const [data, setData] = useState(initState.data);

  const handleSearch = (params?: any) => {
    setSearchParam(params);
    apis.sqlRule.list(encodeQueryParam(params))
      .then(response => {
        if (response.status === 200) {
          setData(response.result);
        }
      })
      .catch(() => {
      });
  };

  useEffect(() => {
    handleSearch(searchParam);
  }, []);

  const edit = (record: RuleInstanceItem) => {
    const temp = JSON.parse(record.modelMeta);
    temp.option = 'update';
    temp.id = record.id;
    setCurrent(temp);
    setSaveVisible(true);
  };

  const _start = (record: RuleInstanceItem) => {
    apis.sqlRule._start(record.id)
      .then(response => {
        if (response.status === 200) {
          message.success('启用成功');
          handleSearch(searchParam);
        }
      })
      .catch(() => {
      });
  };

  const _stop = (record: RuleInstanceItem) => {
    apis.sqlRule._stop(record.id)
      .then(response => {
        if (response.status === 200) {
          message.success('停用成功');
          handleSearch(searchParam);
        }
      })
      .catch(() => {
      });
  };

  const handleDelete = (record: RuleInstanceItem) => {
    apis.sqlRule.remove(record.id)
      .then(response => {
        if (response.status === 200) {
          message.success('删除成功');
          handleSearch(searchParam);
        }
      })
      .catch(() => {
      });
  };

  const saveOrUpdate = (item: RuleInstanceItem) => {
    apis.sqlRule.saveOrUpdate(item)
      .then((response: any) => {
        if (response.status === 200) {
          message.success('保存成功');
          setSaveVisible(false);
          handleSearch(searchParam);
        }
      })
      .catch(() => {
      });
  };


  const statusMap = new Map();
  statusMap.set('已启动', 'success');
  statusMap.set('已停止', 'error');
  statusMap.set('已禁用', 'processing');

  const columns: ColumnProps<RuleInstanceItem>[] = [
    {
      title: 'ID',
      dataIndex: 'id',
    },

    {
      title: '名称',
      dataIndex: 'name',
    },
    {
      title: '创建时间',
      dataIndex: 'createTime',
      render: (text: any) => text ? moment(text).format('YYYY-MM-DD HH:mm:ss') : '/',
    },
    {
      title: '状态',
      dataIndex: 'state',
      render: record => record ? <Badge status={statusMap.get(record.text)} text={record.text}/> : '',
    },
    {
      title: '操作',
      width: '25%',
      render: (text, record) => (
        <Fragment>
          <a onClick={() => edit(record)}>编辑</a>
          <Divider type="vertical"/>
          {record.state?.value === 'started' ? (
            <span>
              <Popconfirm title="确认停止？" onConfirm={() => _stop(record)}>
                <a>停止</a>
              </Popconfirm>
            </span>
          ) : (
            <span>
              <Popconfirm title="确认启用?" onConfirm={() => _start(record)}>
                <a>启动</a>
              </Popconfirm>
              <Divider type="vertical"/>
              <Popconfirm title="确认删除?" onConfirm={() => handleDelete(record)}>
                <a>删除</a>
              </Popconfirm>
            </span>
          )}
          <Divider type="vertical"/>
          <a onClick={() => downloadObject(record, '数据转发')}>下载配置</a>
        </Fragment>
      ),
    },
  ];

  const onTableChange = (
    pagination: PaginationConfig,
    filters: any,
    sorter: SorterResult<RuleInstanceItem>,
  ) => {
    handleSearch({
      pageIndex: Number(pagination.current) - 1,
      pageSize: pagination.pageSize,
      terms: searchParam,
      sorts: sorter,
    });
  };

  return (
    <PageHeaderWrapper title="数据转发">
      <Card bordered={false}>
        <div className={styles.tableList}>
          <div>
            <Search
              search={(params: any) => {
                if (!params) params = {};
                params.modelType = 'sql_rule';
                handleSearch({ terms: params, pageSize: 10 });
              }}
            />
          </div>
          <div className={styles.tableListOperator}>
            <Button
              icon="plus"
              type="primary"
              onClick={() => {
                setCurrent({});
                setSaveVisible(true);
              }}
            >
              新建
            </Button>
          </div>
          <div className={styles.StandardTable}>
            <Table
              loading={props.loading}
              dataSource={data?.data}
              columns={columns}
              rowKey="id"
              onChange={onTableChange}
              pagination={{
                current: data.pageIndex + 1,
                total: data.total,
                pageSize: data.pageSize,
                showQuickJumper: true,
                showSizeChanger: true,
                pageSizeOptions: ['10', '20', '50', '100'],
                showTotal: (total: number) =>
                  `共 ${total} 条记录 第  ${data.pageIndex + 1}/${Math.ceil(
                    data.total / data.pageSize,
                  )}页`,
              }}
            />
          </div>
        </div>
      </Card>
      {saveVisible && (
        <Save
          data={current}
          close={() => {
            setSaveVisible(false);
            setCurrent({});
          }}
          save={(data: RuleInstanceItem) => {
            saveOrUpdate(data);
          }}
        />
      )}
    </PageHeaderWrapper>
  );
};
export default Form.create<Props>()(SqlRuleList);
