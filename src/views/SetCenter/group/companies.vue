<template>
  <div class="card" ref="cardHeight">
    <div :style="{ height: tabHeight + 'px' }">
      <div style="width: 100%; height: 100%">
        <DiyTable 
          ref="diyTable"
          :hasTitle="true" 
          :tableName="props.selectItem?.label ?? props.selectItem?.name" 
          :hasTableHead="true" 
          :tableData="companies"
          :options="options"
          @handleUpdate="handleUpdate"
          :tableHead="tableHead"
        >
          <template #buttons>
            <div style="display: flex;align-items: center">
              <!-- <el-upload
                ref="uploadRef"
                :show-file-list="false"
                accept="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet, application/vnd.ms-excel"
                :auto-upload="false"
              >
              <template #trigger> -->
                <el-button link type="primary" @click="develop">导入集团单位</el-button>
              <!-- </template>
              </el-upload> -->
              <el-button v-if="props.selectItem?.item?.typeName == '集团'" type="primary" link @click="handleShare()">分享集团</el-button>
              <el-button type="primary" @click="handleIdentity()" link>身份设置</el-button>
              <el-button v-if="props.selectItem?.item?.typeName == '集团'" small link type="primary" @click="pullCompanysDialog = true">添加单位</el-button>
              <el-button v-if="props.selectItem?.item?.typeName == '集团'" small link type="primary" @click="viewApplication">查看申请</el-button>
              <el-button v-if="props.selectItem?.item?.typeName == '子集团'" small link type="primary" @click="showAssignDialog">分配单位</el-button>
            </div>
          </template>
          <template #operate="scope">
            <el-dropdown>
              <span class="el-dropdown-link"> ··· </span>
              <template #dropdown>
                <el-dropdown-menu>
                  <el-dropdown-item @click="changeDepartment(scope.row)">变更单位</el-dropdown-item>
                  <el-dropdown-item v-if="scope.row.id !== authority.getSpaceId()" @click="removeFrom(scope.row)" style="color: #f67c80">移出单位</el-dropdown-item>
                </el-dropdown-menu>
              </template>
            </el-dropdown>
          </template>
        </DiyTable>
      </div>
    </div>
  </div>
  <searchCompany v-if="pullCompanysDialog" :checkList="companies" :selectLimit="0" :serachType="3"
    @closeDialog="closeDialog" @checksSearch="checksSearch" />
  <searchCompany v-if="assignDialog" :checkList="companies" :id="rootGroup.id" :selectLimit="0" :serachType="6"
    @closeDialog="hideAssignDialog" @checksSearch="checksCompanySearch" />
  <el-dialog customClass="QrDialog" v-model="dialogVisible" title="邀请加入集团" width="30%">
    <p>方式一：分享二维码，邀请加入集团</p>
    <div class="QrDiv" :key="props.selectItem?.id">
      <QrCodeCustom :qrText="props.selectItem?.label ?? props.selectItem?.name" />
    </div>
    <p>方式二：分享到群组，邀请加入集团</p>
    <div class="share-link">分享到群组...</div>
    <template #footer>
      <span>
        <el-button type="primary" @click="dialogVisible = false">确认</el-button>
      </span>
    </template>
  </el-dialog>
  <el-dialog
    v-model="createDeptDialogVisible"
    title="转移集团"
    width="30%"
    append-to-body
  >
    <el-form
      label-position="top"
      label-width="100px"
    >
      <el-form-item label="集团名称" style="width: 100%">
        <el-input disabled v-model="currentData.team.name" />
      </el-form-item>
      <el-form-item label="所属部门" style="width: 100%">
        <el-tree-select
          v-model="formData.parentId"
          :data="cascaderTree"
          check-strictly
          @node-click="handleSelectTree(selectItem, $event)"
          :render-after-expand="false"
          style="width: 100%"
          :default-expand-all="true"
        />
      </el-form-item>
    </el-form>
    <template #footer>
      <span class="dialog-footer">
        <el-button @click="createDeptDialogVisible = false">取消</el-button>
        <el-button type="primary" @click="editDept">确认</el-button>
      </span>
    </template>
  </el-dialog>
  <identityModal
    v-model:visible="identityVisible"
  />
</template>
<script lang="ts" setup>
import DiyTable from '@/components/diyTable/index.vue'
import { onMounted, reactive, ref, watch, nextTick } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
import searchCompany from '@/components/searchs/index.vue'
import authority from '@/utils/authority'
import QrCodeCustom from '@/components/qrCode/index.vue'
import { TargetType} from '@/ts/coreIndex'
import { setCenterStore } from '@/store/setting'
import identityModal from '../department/components/identityModal.vue';
const store = setCenterStore()

const identityVisible = ref(false)
// 权限管理
const handleIdentity = ()=> {
  identityVisible.value = true
}
const props = defineProps<{
  selectItem: any // 节点数据
  tabHeight: any
}>()
const rootGroup = ref<any>({})
// 表格用户数据
let companies = ref<any>([])

const router = useRouter()
// 表格展示数据
const pageStore = reactive({
  tableData: [],
  currentPage: 1,
  pageSize: 20,
  total: 0
})

const diyTable = ref(null)

const options = {
  expandAll: false,
  checkBox: false,
  order: true,
  switchType:false,
  noPage: false,
  selectLimit: 0
}

const tableHead = ref([
  {
    prop: 'name',
    label: '简称',
    name: 'name'
  },
  {
    prop: 'code',
    label: '信用代码'
  },
  {
    prop: 'team.name',
    label: '全称',
    name: 'teamName'
  },
  {
    prop: 'team.code',
    label: '代码'
  },
  {
    prop: 'team.remark',
    label: '简介',
    name: 'teamRemark'
  },
  //  {
  //   prop: '',
  //   label: '所属集团',
  //   name: ''
  // },
  {
    type: 'slot',
    label: '操作',
    fixed: 'right',
    align: 'center',
    name: 'operate'
  }
])

const handleUpdate = (page: any) => {
  pageStore.currentPage = page.currentPage
  pageStore.pageSize = page.pageSize
  getCompanies()
}
let formData = ref<any>({})
let cascaderTree = ref<OrgTreeModel[]>([])
function getSelectTree() {
  setTimeout(()=>{
    store.loadTreeData(false).then((res: any[]) => {
      cascaderTree.value = res
    })
  },500)
}
let newDept = ref()
const handleSelectTree = (_?: any, info?: {intans: any}) => {
  newDept.value = info?.intans
}
// 变更部门
const editDept = async ()=> {
  if(formData.value?.parentId === store.currentSelectItme?.value) {
    createDeptDialogVisible.value = false
    return
  }
  if (newDept.value) {
    if (await store.currentSelectItme.intans?.removeMember(currentData.value)) {
      if (await newDept.value.pullMember(currentData.value)) {
        ElMessage({ message: '操作成功',type: 'success' })
        getCompanies()
        createDeptDialogVisible.value = false
      } else {
        return false;
      }
    }
  }
}

// 加载岗位下的用户
const getCompanies = async (currentData = props.selectItem) => {
  if(currentData){
    const backData =  await currentData.item?.loadMembers({
      filter: "",
      limit: 20,
      offset: 0
    })
    if(backData?.result){
      companies.value =backData.result;
      pageStore.total = backData.total
      diyTable.value.state.page.total = pageStore.total
    }else{
      companies.value =[];
      pageStore.total = 0
    }
  }
}

let currentData = ref<any>({}) 
let createDeptDialogVisible = ref<boolean>(false)
// 变更单位
const changeDepartment = (row: any) => {
  formData.value = { parentId: store.currentSelectItme?.value }
  currentData.value = row
  createDeptDialogVisible.value = true
}

const pullCompanysDialog = ref<boolean>(false)
const closeDialog = () => {
  pullCompanysDialog.value = false
}
type arrList = {
  id: string
}
const checksSearch = (val: any) => {
  if (val.value.length > 0) {
    let arr: Array<arrList> = []
    val.value.forEach((element: any) => {
      arr.push(element.id)
    })
    pullCompanys(arr)
  } else {
    pullCompanysDialog.value = false
  }
}
const checksCompanySearch = (val: any) => {
  if (val.value.length > 0) {
    let arr: Array<arrList> = []
    val.value.forEach((element: any) => {
      arr.push(element.id)
    })
    assign(arr)
  } else {
    assignDialog.value = false
  }
}

//导入集团单位
const develop = ()=>{
  ElMessage({
    message: '功能正在开发中！',
    type: 'warning'
  })
}

//拉单位进集团
const pullCompanys = async (arr: any) => {
  const data =  await props.selectItem?.item?.pullMembers(arr,TargetType.Company)
  if (data) {
    ElMessage({
      message: '添加成功',
      type: 'success'
    })
    getCompanies()
    pullCompanysDialog.value = false;
  }
}

//查看申请
const viewApplication = (row: any) => {
  router.push({ path: '/todu', query: { type: 1, id: props.selectItem.id } })
}

// 移除
const removeFrom = async (row: any) => {
  const data =  await props.selectItem?.item?.removeMember(row)
  if(data){
    ElMessage({
      message: '移出成功',
      type: 'success'
    })
    getCompanies()
  }
}

const assignDialog = ref<boolean>(false)
const hideAssignDialog = () => {
  assignDialog.value = false
}

const showAssignDialog = () => {
  assignDialog.value = true
}

// 分配单位到子集团(待提供接口)
const assign = async (arr: any) => {
  const companyIds = arr
  // const data = await groupServices.assignSubgroup(props.selectItem.id,companyIds)
  // if(data){
  //   ElMessage({
  //     message: '分配成功',
  //     type: 'success'
  //   })
  //   hideAssignDialog()
  //   getCompanies()
  // }
}

const cardHeight = ref(null)
const tabHeight = ref<number>(100)
onMounted(() => {
  console.log(store)
  getSelectTree()
  nextTick(() => {
    let headerHeight = cardHeight.value?.clientHeight
    tabHeight.value = headerHeight
  })
})

// 分享集团
const dialogVisible = ref(false)
const handleShare = () => {
  dialogVisible.value = true
}

watch(props, () => {
  pageStore.currentPage = 1;
  getCompanies()
  nextTick(() => {
    let headerHeight = cardHeight.value?.clientHeight
    tabHeight.value = headerHeight
  })
})
watch(props.tabHeight, () => {
  let headerHeight = cardHeight.value?.clientHeight
  tabHeight.value = headerHeight
});

</script>

<style lang="scss" scoped>
:deep(.el-table th.el-table__cell) {
  background-color: #eceffb!important;
}
.el-dropdown-link{
  padding: 2px 10px;
  cursor: pointer;
  border-radius: 10px;
}
.el-dropdown-link:hover{
  background:#1642cb;
  color: #fff;
}
.QrDialog {
  .txt {
    margin: 0 0 10px 15px;
    text-align: center;
  }
  .QrDiv {
    text-align: center;
  }
}

.card {
  height: 100%;
  width: 100%;
  // background-color: #fff;
  padding: 10px 0;
  .btn-check{
    padding: 8px 16px;
    color: #154ad8;
  }
  .btn-check:hover{
    background: #154ad8;
    color: #fff;
    padding: 8px  16px;
  }
  .search {
    width: 50%;
  }
}
</style>
