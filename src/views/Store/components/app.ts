import authority from '@/utils/authority'
import { useUserStore } from '@/store/user'
import { ElMessage } from 'element-plus'
import {appCtrl} from '@/ts/coreIndex'

const store = useUserStore()
type TreeData = {
  children: any[]
  data: any
  disabled: boolean
  hasNodes: boolean
  id: string
  label: string
  type: string
}
type PageStore = {
  [x: string]: any
  currentPage: number
  tableData?: any[]
  pageSize: number
  total?: number
}

/*
 *分发分享业务逻辑
 */
export class Application {
  /*
   *分发分享变量定义
   */
  private typePD: number
  private rootTreeId: string
  private parentIdMap: any = {}
  public cascaderTree: any
  public tabs: any

  constructor(typePD?: number) {
    this.typePD = typePD
  }
  /**
   * 树形权限判断
   * @param nodes 过滤出的树形数据
   */
  private isAuthAdmin = (nodes: any) => {
    //判断是否有操作权限
    for (const node of nodes) {
      node.disabled = !authority.IsApplicationAdmin([node.data.id, node.data.belongId])
      if (node.children) {
        this.isAuthAdmin(node.children)
      }
    }
    return nodes
  }
  /*
   * 过滤掉工作组作为表单级联数据
   */
  private filter = (nodes: OrgTreeModel[]): OrgTreeModel[] => {
    if (this.typePD == 1) {
      nodes = nodes.filter((node) => node.data?.typeName !== '工作组')
    } else {
      nodes = nodes.filter(
        (node) => node.data?.typeName !== '工作组' && node.data?.authAdmin === true
      )
    }
    for (const node of nodes) {
      node.children = this.filter(node.children)
    }
    return nodes
  }
  
  public async submitAll(data: any,curResource:any) {
    let departAdd: any[] = []
    let departDel: any[] = []

    data.list.forEach((el: any) => {
      if (el.type == 'add') {
        departAdd.push(el.id)
      } else if (el.type == 'del') {
        departDel.push(el.id)
      }
    })

    if(data.destType == '1'){
      data.destType ='组织'
    }else if(data.destType == '2'){
      data.destType ='职权'
    }else if(data.destType == '3'){
      data.destType ='身份'
    }else if(data.destType == '4'){
      data.destType ='人员'
    }
    if(this.typePD ==3){ //分享
      if (departAdd.length > 0) {
        const success = await appCtrl.curProduct?.createExtend(
          data.destType == '组织' ? '0' : data?.switchId,
          departAdd,
          data.destType
        );
        success && ElMessage.success(`新增共享, 操作成功`);
      }
      if (departDel.length > 0) {
        const success =  await appCtrl.curProduct?.deleteExtend(
          data.destType == '组织' ? '0' :  data?.switchId,
          departDel,
          data.destType
        );
        success && ElMessage.success(`删除共享, 操作成功`);
      }
    }else{  //分配
      let item = curResource;
      if (departAdd.length > 0) {
        const success =  await item?.createExtend(
          data.destType == '组织' ? '0' :  data?.switchId,
          departAdd,
          data.destType
        );
        success && ElMessage.success(`新增分配, 操作成功`);
      }
      if (departDel.length > 0) {
        const success =  await item?.deleteExtend(
          data.destType == '组织' ? '0' :  data?.switchId,
          departDel,
          data.destType
        );
        success && ElMessage.success(`删除分配, 操作成功`);
      }
    }
    
  }

  private handleTreeData(node: any, belongId: string) {
    node.disabled = !(node.belongId && node.belongId == belongId)
    if (node.nodes) {
      node.nodes = node.nodes.map((children: any) => {
        return this.handleTreeData(children, belongId)
      })
    }
    //判断是否有操作权限
    return node
  }
}

export const appstore = new Application()
