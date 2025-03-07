<template>
  <div class="content box">
    <div class="body" ref="bodyWrap" v-if="!state.addOrEdit">
      <div class="table-box">
        <DiyTable
          :style="{ width: '100%' }"
          ref="diyTable"
          :hasTabs="true"
          :hasTitle="false"
          :hasTableHead="true"
          :tableData="state.dataList"
          :options="options"
          :total="pageStore.total"
          @handleUpdate="handleUpdate"
          :tableHead="state.tableHead"
        >
          <template #slot-tabs>
            <h4>流程列表</h4>
          </template>
          <template #buttons>
            <el-button @click="addNew" type="primary" link>创建流程</el-button>
          </template>
          <template #operate="scope">
            <el-dropdown>
              <span class="el-dropdown-link"> ··· </span>
              <template #dropdown>
                <el-dropdown-menu>
                  <el-dropdown-item @click="handleCommand('bind', scope.row)">绑定应用</el-dropdown-item>
                  <el-dropdown-item @click="handleCommand('edit', scope.row)">编辑</el-dropdown-item>
                  <el-dropdown-item @click="handleDel(scope.row)" style="color: #f67c80">删除</el-dropdown-item>
                </el-dropdown-menu>
              </template>
            </el-dropdown>
          </template>
          <template #slot-card>
            <div class="card-list">
              <div
                class="card-item"
                v-for="(item, index) in state.dataList"
                :key="index"
              >
                <div class="item-head">
                  <div class="item-img">{{ item.name.substring(0,1) }}</div>
                  <div class="item-head-content">
                    <p>
                      <span
                        >{{ item.name }}
                      </span>
                        <el-dropdown>
                          <span class="el-dropdown-link drop-list"> ··· </span>
                          <template #dropdown>
                            <el-dropdown-menu>
                              <el-dropdown-item
                                link
                                type="primary"
                                @click="handleCommand('bind', item)"
                                >绑定应用</el-dropdown-item
                              >
                              <el-dropdown-item
                                link
                                type="primary"
                                @click="handleCommand('edit', item)"
                              >
                                编辑</el-dropdown-item
                              >
                              <el-dropdown-item
                                link
                                type="primary"
                                style="color: #f67c80"
                                @click="handleDel(item)"
                                >删除
                              </el-dropdown-item>
                            </el-dropdown-menu>
                          </template>
                        </el-dropdown>
                    </p>
                  </div>
                </div>
                <div class="item-content">
                  {{item.remarks || '暂无描述'}}
                </div>
                <div class="time">创建于 {{ item.createTime }}</div>
              </div>
            </div>
          </template>
        </DiyTable>
      </div>
      <div class="bindApp-box">
        <BindAppList ref="childRefs" :bindAppMes="state.bindAppMes" :resultList="state.resultList" @showDialog="openShareDialog()"></BindAppList>
      </div>
    </div>
    <Wflow v-if="state.addOrEdit" :contionData="state.contionData" @exit="exit" @clearData="clearData"></Wflow>
    <el-dialog
      v-if="dialogType.bindVisible"
      v-model="dialogType.bindVisible"
      custom-class="bind-dialog"
      :title="dialogTitle"
      width="900px"
      draggable
      :close-on-click-modal="false"
    >
      <BindDialog
        :bindAppMes="state.bindAppMes"
        @refresh="refresh"
        @closeDialog="closeDialog(false)"
      ></BindDialog>
    </el-dialog>
  </div>
</template>
<script lang="ts" setup>
// @ts-nocheck
import DiyTable from "@/components/diyTable/index.vue";
import BindAppList from "./bindAppList.vue";
import BindDialog from "./bindDialog.vue";
import Wflow from "../wflow/index.vue";
import { ref, reactive, onMounted } from "vue";
import {processCtrl,userCtrl} from '@/ts/coreIndex'
import { useRouter } from "vue-router";
import { stat } from "fs";
import DefaultProps from "@/components/wflow/process/DefaultNodeProps"

type StateType = {
  dataList: any[]; //表格数据
  tableHead: any[]; //表头
  bindAppMes: { name: string; id: string };
  addOrEdit:boolean;
  contionData:{name: string; labels:object; fields:string}
};

const state: StateType = reactive({
  dataList: [],
  tableHead: [
    {
      prop: 'name',
      label: '流程名称',
    },
    {
      prop: 'createUser',
      label: '创建人',
      name: 'createUser'
    },
    {
      prop: 'remarks',
      label: '备注',
      name: 'remark'
    },
    {
      prop: 'createTime',
      label: '创建时间',
      name: 'createTime'
    },
    {
      type: 'slot',
      label: '操作',
      fixed: 'right',
      align: 'center',
      width: '150',
      name: 'operate'
    }
  ],
  bindAppMes:{name:'',id:''},
  addOrEdit:false,
  contionData:{
    name: '',
    labels: [{ label: '', value: '', type: '' }],
    fields: '',
  },
  resultList:[]
});

// 表格展示数据
const pageStore = reactive({
  tableData: [],
  currentPage: 1,
  pageSize: 10,
  total: 0
})

const options = ref<any>({
  checkBox: false,
  switchType:true,
  order: true,
  selectLimit: 1,
  defaultSort: { prop: 'createTime', order: 'descending' },
  treeProps: {
    children: 'children',
    hasChildren: 'hasChildren'
  },
})

// 注册页面实例
const router = useRouter();
const diyTable = ref(null);

onMounted(() => {
  initData()
})

//加载数据
const initData = async () =>{
  const result = await userCtrl.space.getDefines(false);
  state.resultList = result
  if (result) {
    for(var i = 0;i<result.length;i++){
      result[i].remarks = JSON.parse(result[i].content || '{}').fields
    }
    state.bindAppMes = result[0] || {}
    state[`dataList`] = result ;
    diyTable.value.state.page.total = result.length
  }
}

//新增绑定
const addNew = () =>{
  state.addOrEdit = true
}

//分页
const handleUpdate = (page: any) => {
  pageStore.currentPage = page.currentPage
  pageStore.pageSize = page.pageSize
  remoteMethod()
}
const dialogTitle = ref<string>('当前流程')
const dialogType: any = reactive({
  bindVisible: false, //绑定弹窗
});
// 记录当前操作的 应用信息
const selectProductItem = ref<any>();
// 处理 设置 菜单选择事件
const handleCommand = (
  command: string | number | object,
  item: any
) => {
  selectProductItem.value = item;
  // console.log("selectProductItem", selectProductItem.value);
  dialogTitle.value = '当前流程:' + item.name
  switch (command) {
    case "bind": //绑定应用
      openShareDialog();
      break;
    case "edit": //编辑
      ElMessageBox.confirm('与该流程相关的未完成待办将会重置，是否确定编辑?',
        {
          confirmButtonText: '确认',
          cancelButtonText: '取消',
          type: 'warning',
        }
      )
      .then(() => {
        const editorDataMes = JSON.parse(item?.content || '{}');
        processCtrl.setProcessDesignTree(editorDataMes);
        const contionData = {
          name: editorDataMes.name,
          labels: JSON.parse(editorDataMes.remark || '{}'),
          fields: editorDataMes.fields,
        };
        DefaultProps.setFormFields(contionData.labels) 
        processCtrl.setCondtionData(contionData);
        state.contionData = contionData;
        state.addOrEdit = true
        return new Promise<boolean>((resolve) => {
          resolve(true);
        });
      })
      .catch(() => {});
      break;
    default:
      break;
  }
};

//删除应用
const handleDel = (item: any) => {
  ElMessageBox.confirm(`确认删除  ${item.name}?`, "警告", {
    confirmButtonText: "确认",
    cancelButtonText: "取消",
    type: "warning",
  })
    .then(async () => {
      if (await userCtrl.space.deleteDefine(item.id)) {
        initData();
        ElMessage({
					message: '删除成功！',
					type: 'success'
				})
      }
    })
    .catch(() => {});
};

//  打开绑定应用弹窗
const openShareDialog = () => {
  dialogType.bindVisible = true;
};

const childRefs = ref('childRefs')

// 关闭弹窗
const closeDialog = (key: boolean) => {
  dialogType.bindVisible = key;
};

//刷新绑定应用列表
const refresh = () =>{
  childRefs.value.initData()
}

//清理数据
const clearData = () =>{
  state.addOrEdit = false;
  initData()
  clearForm()
}

//退出
const exit = (key: boolean) => {
  ElMessageBox.confirm('未发布的内容将不会被保存，是否直接退出 ?', '提示', {
    confirmButtonText: '确认',
    cancelButtonText: '取消',
    type: 'warning'
  }).then(() => {
    state.addOrEdit = false;
    initData()
    clearForm()
  })
};

const clearForm = () => {
  processCtrl.setProcessDesignTree({
    name: '',
    code: 'code',
    remark: '',
    fields: '',
    resource: {
      nodeId: 'ROOT',
      parentId: null,
      type: 'ROOT',
      name: '发起人',
      children: {
        nodeId: 'node_590719745693',
        parentId: 'ROOT',
        props: {},
        type: 'CONDITIONS',
        name: '条件分支',
      },
    },
  });
  processCtrl.setCondtionData({
    name: '',
    labels: [{ label: '', value: '', type: '' }],
    fields: '',
  });
  state.contionData = {
    name: '',
    labels: [{ label: '', value: '', type: '' }],
    fields: '',
  };
};


</script>
<style lang="scss" scoped>
  .el-dropdown-link{
    padding: 2px 10px;
    cursor: pointer;
    border-radius: 10px;
  }
  .el-dropdown-link:hover{
    background:#1642cb;
    color: #fff;
  }
  .content {
    width: 100%;
    height: 100%;
    display: flex;
    flex-direction: column;
    flex: 1;
    box-sizing: border-box;
    .body {
      height: 100%;
      background: #fff;
      display: flex;
      flex-direction: column;
      flex: 1;
      .table-box{
        width: 100%;
        height: 400px;
      }
      .bindApp-box{
        margin-top: 20px;
        width: 100%;
        height: calc(100% - 440px);
      }
    }
  }
  .card-list {
    padding: 10px 0;
    overflow-y: auto;
    display: flex;
    flex-wrap: wrap;
    .card-item {
      width: 279px;
      box-sizing: border-box;
      padding: 14px;
      border-radius: 5px;
      margin-right: 12px;
      margin-bottom: 12px;
      border: 1px solid #e9e9e9;
      .item-head {
        display: flex;
        padding-bottom: 10px;
        border-bottom: 1px solid #eee;
        align-items: center;
        .item-img {
          background: #d4f0fc;
          text-align: center;
          width: 40px;
          height: 40px;
          line-height: 40px;
          border-radius: 50%;
          margin-right: 15px;
          font-size: 14px;
          color: #0C4EFF;
        }
      }
      .item-head-content {
        display: flex;
        flex: 1;
        flex-direction: column;
        p:nth-child(1) {
          display: flex;
          justify-content: space-between;
          align-items: center;
          span {
            margin-right: 5px;
          }
          .drop-list {
            display: flex;
            flex-direction: column;
            align-items: center;
          }
        }
        p:nth-child(2) {
          color: #9c9c9c;
          font-size: 14px;
        }
      }
      .item-content {
        font-size: 12px;
        margin: 12px 0;
        color: #7f7f7f;
      }
      .tag {
        margin: 12px 0;
      }
      .time {
        font-size: 12px;
        color: #7f7f7f;
      }
    }
  }
</style>
