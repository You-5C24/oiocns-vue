<template>
  <el-card class="card">
    <div class="contentTile">
      <component @click="goBack" :is="'ArrowLeft'" style="width: 16px;height: 16px;cursor:pointer;position: absolute;left: 20px;"></component>
      <component :is="'User'" style="width: 16px;height: 16px;color:#154ad8"></component>&nbsp;&nbsp;
      <b style="font-size: 14px;">集团设置</b>
    </div>
    <div class="search-wrap">
      <el-input class="search" v-model="filterText" placeholder="搜索" :prefix-icon="Search" />
    </div>

    <div class="tree">
      <el-tree :data="orgTree" :expand-on-click-node="false" ref="treeRef" @node-click="nodeClick" node-key="id"
        :default-expanded-keys="defaultExpandedKeys" :filter-node-method="filterNode" lazy :load="loadNode">
        <template #default="{ node, data }">
          <span class="custom-tree-node" @mouseover='onHover(node.id)' @mouseout="onOut">
            <div class="tree-box">
              <img v-if="![1, 2].includes(node.level)" src="@/assets/img/zuzhijiagou.jpg" class="tree-icon" />
              <span :class="['创建集团', '加入集团'].includes(data.label) ? 'sp_title': ''">{{ data.label }}</span>
              <span class="sp_10" v-show="node.id === state.flag">
               <el-popover
                  placement="right"
                  :width="100"
                  trigger="click"
                >
                  <template #reference>
                    <el-icon><Plus /></el-icon>
                  </template>
                  <div class="btn-bus" @click="clickBus" :style="{cursor: 'pointer'}" >
                    <div class="row-btn" v-for="(item,index) in data.btns" :key="index" :data-index="item.id">{{item.name}}</div>
                  </div>
                </el-popover>&nbsp;
                <el-popover
                  placement="right"
                  :width="100"
                  trigger="click"
                >
                  <template #reference>
                    <el-icon><MoreFilled /></el-icon>
                  </template>
                  <slot name="more"></slot>
                </el-popover>
              </span>
            </div>
          </span>
        </template>
      </el-tree>
    </div>

  </el-card>

  <el-dialog v-model="createGroupDialogVisible" title="请录入子集团信息" width="40%" center append-to-body @close="createGroupDialogHide">
    <div>
      <el-form-item label="节点名称" style="width: 100%">
        <el-input v-model="formData.name" placeholder="请输入节点名称" clearable style="width: 100%" />
      </el-form-item>
      <el-form-item label="节点编号" style="width: 100%">
        <el-input v-model="formData.code" placeholder="请输入节点编号" clearable style="width: 100%" />
      </el-form-item>
      <el-form-item label="上级节点" style="width: 100%">
        <el-cascader :props="cascaderProps" :options="cascaderTree" v-model="formData.parentId" style="width: 100%"
          placeholder="请选择上级节点"/>
      </el-form-item>

      <el-form-item label="节点简介" style="width: 100%">
        <el-input v-model="formData.teamRemark" :autosize="{ minRows: 5 }" placeholder="请输入节点简介" type="textarea" clearable />
      </el-form-item>
    </div>
    <template #footer>
      <span class="dialog-footer">
        <el-button @click="createGroupDialogHide">取消</el-button>
        <el-button type="primary" @click="createGroup">确认</el-button>
      </span>
    </template>
  </el-dialog>

  <CreateTeamModal 
    :title="activeModal"
    v-model:visible="visible"
    :current="current"
    :typeNames="['集团']"
    @handleOk="handleOk"
  />
  <searchGroup v-if="friendDialog" :serachType="4" @closeDialog="closeDialog"  @checksSearch='checksSearch'></searchGroup>
</template>

<script lang="ts" setup>
import { ref, reactive, onMounted, watch } from 'vue'
import { ElMessage } from 'element-plus';
import searchGroup from '@/components/searchs/index.vue'
import { Search } from '@element-plus/icons-vue'
import authority from '@/utils/authority'
import { useUserStore } from '@/store/user'
import {userCtrl} from '@/ts/coreIndex';
import { setCenterStore } from '@/store/setting'
import CreateTeamModal from '../GlobalComps/createTeam.vue';
const store:any = useUserStore()
const goBack = () => {
  window.history.go(-1)
}
const activeModal = ref('')
const current = ref()
const visible = ref(false)
const handleOk = (newItem: any) => {
  if(newItem) {
    ElMessage.success('新增成功!')
    visible.value = false
    getGroupList()
  }
}

const emit = defineEmits(['nodeClick'])

const loadNode = (node: any, resolve: (data: any[]) => void) => {
  if (node.level === 0) {
    return resolve(orgTree.value)
  } else if(node.level === 1 && node.data.label === '创建集团'){
    return resolve(myGroupList)
  } else if(node.level === 1 && node.data.label === '加入集团'){
    return resolve(addGroupList)
  } else if (node.level === 2) {
    // const data = await node.data.item?.loadSubTeam()
    return resolve([])
    // loadOrgTree(node?.data?.id as string).then((res: any)=> {
    //   return resolve(res ?? [])
    // })
  } else {
    return resolve([])
  }
  
}
const friendDialog = ref<boolean>(false)
const form = reactive({
  name: '',
  code: '',
  teamName: '',
  teamCode: '',
  teamRemark: ''
})
const clickBus = (e:any)=>{
  let id = e.target.dataset.index
  if (id === '2101') { //  单位创建集团
    activeModal.value = '新增|集团'
    visible.value = true
    current.value = userCtrl.company
  } else if(id === '2102') {
    friendDialog.value = true;
  } else if(id === '2103') {
    createGroupDialogVisible.value = true
  }
}
const closeDialog = ()=>{
  friendDialog.value = false;
}
type arrList = {
  id:string
}
const checksSearch=(val:any)=>{
  if(val.value.length>0){
    let arr:Array<arrList> =[]
    val.value.forEach((element:any) => {
      arr.push(element.id)
    });
    addGroupFun(arr)
  }else{
    friendDialog.value = false;
  }
}
const addGroupFun = async(arr:any) => {
  const success = await userCtrl.company.applyJoinGroup(arr.join(','))
  if (success) {
    ElMessage({
      message: '申请成功',
      type: 'warning'
    })
    friendDialog.value = false
  }
}

const onHover = (id: string) => {
  state.flag = id
}
const onOut = () => {
  state.flag = ''
}

const state = reactive({
  options: [],
  flag: '', // 是否高亮标记
})
let formData = ref<any>({})
const selectItem = ref<any>();

  
const allowEdit = () => {
  if(selectItem.value && selectItem.value.id){
    return authority.IsRelationAdmin([
      selectItem.value.id,
      selectItem.value.belongId
    ])
  }
  return false
}
// 获取集团树点击的信息
const selectItemChange = (data: any) => {
  selectItem.value = data;
};
const cascaderProps = {
  checkStrictly: true,
  value: 'id',
  emitPath: false,
}
// 集团树
let cascaderTree = ref<OrgTreeModel[]>([])

// 当前用户的集团
let groups = reactive([])
let orgTree = ref<OrgTreeModel[]>([])

let defaultExpandedKeys = ref([1,2])

const filterText = ref('')
const treeRef = ref<any>()

// 刷新
const refresh = () => {
  getGroupList()
};
defineExpose({ refresh,selectItemChange });

let myGroupList: any = []
let addGroupList: any = []

// 查询集团列表
const getGroupList = () => {
  setTimeout(async()=>{
    const groups = await userCtrl.company.getJoinedGroups(false);
    myGroupList = []
    addGroupList = []
    groups.length && groups.forEach((item: any) => {
      if (item.createUser == store.queryInfo.id) {
        myGroupList.push({item, label: item?.target?.name ?? item?.name, btns: [{
          name: '创建子集团',
          id: '2103'
        }]})
      } else {
        addGroupList.push({item, label: item?.target?.name, btns: [{
          name: '加入集团',
          id: '2100'
        }]})
      }
    })
    let newObj:any =  [
      {
        id: 1,
        label: "创建集团",
        btns:[{
          "name":"创建集团",
          "id":"2101"
        }],
        children: myGroupList
      },
      {
        id: 2,
        label: "加入集团",
        btns:[{
            "name":"加入集团",
            "id":"2102"
        }],
        children: addGroupList
      }
    ]
    orgTree.value = newObj;
    state.options = groups.map(g => {
      return { value: g.id, label: g.name }
    })
    orgTree.value.length && emit('nodeClick', orgTree.value[0]?.children[0])
    // nodeClick(orgTree.value[0]?.children[0])
  },500)

}

const nodeClick = (val: any, nodeAttribute?: any, event?: any) => {
  if (['创建集团', '加入集团'].includes(val.label)) return
  emit('nodeClick', val)
  setCenterStore().currentSelectItme = val
  formData.value.parentId = val.id
}

// 树节点搜索
const filterNode = (value: string, data: any) => {
  if (!value) return true
  return data.label.includes(value)
}

// 加载集团树
// const loadOrgTree = async (id?: string)=>{
//   let treeData: any = []
//   const groups = await userCtrl.company.getJoinedGroups(false).then((res: any) => {
//     // orgTree.value = []
//     // orgTree.value.push(newObj)
//     cascaderTree.value = [res.data]
//     nodeClick(res.data)
//     treeData = res.data
//   })
//   return treeData?.children
// }

let createGroupDialogVisible = ref<boolean>(false)

const createGroupDialogHide = () => {
  createGroupDialogVisible.value = false
}

const createGroup = ()=>{
  console.log('添加子集团');
}

//获取部门
onMounted(() => {
  // 查询集团
  getGroupList()
})

watch(filterText, (val) => {
  treeRef.value!.filter(val)
})

</script>
<style lang="scss" scoped>
.contentTile{
  display: flex;
  justify-content: center;
  align-items: center;
  padding: 10px;
  background-color: #f9fbfe;
  font-size: 16px;
}
.card {
  height: 100%;
  border: 0;
}
:deep(.el-card__body){
  padding: 0 !important;
}

.tree{
  padding: 0 10px;
  position: relative;
  height: calc(100vh - 200px);
  overflow-y: auto;
}
.search-wrap{
  margin-top: 10px;
}
.search {
  font-size: 12px;
  .el-input__inner {
    font-size: 12px;
  }
}
.row-btn{
  text-align: center;
  line-height: 27px;
}
.row-btn:hover{
  background: #EBEEF5;
}
.row-btn:last-child{
  margin-bottom: 0;
}
:deep(.el-tree-node__content) {
  height: 40px;
  position: relative;
}
.custom-tree-node {
  width: 280px;
  overflow: hidden;
  text-overflow: ellipsis;
  word-spacing: nowrap;
  display: flex;
  cursor: pointer;
  .sp_10{
    position: absolute;
    right: 8px;
  }
  .sp_title {
    color: #909399;
    font-size: 13px;
  }
}

.tree-icon{
  width: 14px;
  height: 14px;
  display: block;
  margin-top: -3px;
  margin-right: 3px;
}

.tree-box {
  display: flex;
  align-items: center;

  &__text {
    margin-left: 5px;
  }
}
// 去掉el-input自带边框
:deep(.search .el-input__wrapper) {
    // margin: 15px;
    // padding-left: 15px !important;
    // box-sizing: border-box;
    // border: none !important;
    // box-shadow: none !important;
    // padding: 0px; //前边边距去掉
    // border-radius: 15px;
    // background: #f2f4f9;
  }
</style>

