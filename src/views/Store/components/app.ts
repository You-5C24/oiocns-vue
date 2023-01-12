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

  /**
   *@desc 提交radio = 1 时的方法
   *@param data 提交的数据
   *@param resource 所选择的资源信息
   */
  public async submitAll(data: any, resource?: any,destType:string = '组织',typePD?:number) {
    let departAdd: any[] = []
    let departDel: any[] = []

    data.forEach((el: any) => {
      if (el.type == 'add') {
        departAdd.push(el.id)
      } else if (el.type == 'del') {
        departDel.push(el.id)
      }
    })
    let teamId = this.typePD == 1 ? this.rootTreeId : this.typePD == 3 ? resource : store.queryInfo.id
    if(typePD ==3){
      teamId = '0';
    }
    if(destType == '1'){
      destType ='组织'
    }else if(destType == '2'){
      destType ='职权'
    }else if(destType == '3'){
      destType ='身份'
    }else if(destType == '4'){
      destType ='人员'
    }
    if(typePD ==3){
      if (departAdd.length > 0) {
        await appCtrl.curProduct?.createExtend(
          '0',
          departAdd,
          destType
        );
      }
      if (departDel.length > 0) {
         await appCtrl.curProduct?.deleteExtend(
          '0',
          departDel,
          destType
        );
      }
    }else{
      // TODO 根据资源类型判断
      // const getCurResource = () => {
      //   return appCtrl.curProduct?.resource?.find(
      //     (R: any) => R.resource.id === resourceId,
      //   );
      // };
      await appCtrl.curProduct?.deleteExtend(
        appCtrl.curProduct.id,
        departDel,
        destType
      );
    }
    
  }
  /**
   *@desc 提交radio != 1 时的方法
   *@param data 所选中的数据
   *@param switchData 接口所需teamid数据
   *@param destType 区分分发分享的类型
   *@param resource 所选中的资源信息
   */

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
