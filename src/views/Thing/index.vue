<template>
  <div class="thing">
    <NavList ref="navRef" :NavData="state.navData" @clickFileFromTree="clickFile"></NavList>
    <div class="thingMainBox">
      <div class="table">
        <DiyTable
          :style="{ width: '100%' }"
          ref="diyTable"
          :hasTabs="true"
          :tableName="'操作'"
          :hasTitle="false"
          :hasTableHead="true"
          :tableData="state.thingList"
          :options="options"
          :total="pageStore.total"
          @handleUpdate="handleUpdate"
          :tableHead="state.tableHead"
        >
          <template #operate="scope">
            <el-dropdown trigger="click">
              <span class="el-dropdown-link"> ··· </span>
              <template #dropdown>
                <el-dropdown-menu>
                  <el-dropdown-item link type="primary">上架</el-dropdown-item>
                  <el-dropdown-item link type="primary">下架</el-dropdown-item>
                </el-dropdown-menu>
              </template>
            </el-dropdown>
          </template>
          <template #slot-card>
            <div class="card-list">
              <div
                class="card-item"
                v-for="(item, index) in state.thingList"
                :key="index"
              >
                <div class="item-head">
                  <div class="item-img">{{ item.prod.name.substring(0,1) }}</div>
                  <div class="item-head-content">
                    <p>
                      <span
                        >{{ item.prod.name }}
                      </span>
                        <el-dropdown>
                          <span class="el-dropdown-link drop-list"> ··· </span>
                          <template #dropdown>
                            <el-dropdown-menu>
                              <el-dropdown-item @click="handleChooseItem(item)">打开</el-dropdown-item>

                              <el-dropdown-item
                                v-if="
                                  item.prod.authority == '所属权' &&
                                  item.prod.belongId ==
                                    store.workspaceData.id
                                "
                                link
                                type="primary"
                                @click="
                                  handleCommand('own', 'putaway', item)
                                "
                                >上架</el-dropdown-item
                              >
                              <el-dropdown-item
                                link
                                type="primary"
                                v-if="
                                  item.prod.belongId ==
                                  store.workspaceData.id
                                "
                                @click="handleCommand('own', 'share', item)"
                              >
                                共享</el-dropdown-item
                              >
                              <el-dropdown-item
                                link
                                type="primary"
                                v-if="userCtrl.isCompanySpace"
                                @click="
                                  handleCommand('own', 'distribution', item)
                                "
                                >分配
                              </el-dropdown-item>
                              <el-dropdown-item
                                link
                                type="primary"
                                @click="goDetail(item)"
                              >
                                查看详情
                              </el-dropdown-item>
                              <el-dropdown-item
                                link
                                type="primary"
                                @click="deleteApp(item.prod.id)"
                                >移除应用</el-dropdown-item
                              >
                              <!-- <el-dropdown-item
                                v-if="
                                  item.prod.resourcesList &&
                                  item.prod.resourcesList.length > 0
                                "
                              >
                                <el-dropdown trigger="hover" placement="top-end">
                                  流程业务
                                  <template #dropdown>
                                    <el-dropdown-menu
                                      style="padding-left: 10px; min-width: 100px"
                                    >
                                      <el-dropdown-item
                                        v-for="resource in item?.resourcesList"
                                        :key="resource.formId"
                                        @click="enterProcess(resource)"
                                        >{{ resource.business }}</el-dropdown-item
                                      >
                                    </el-dropdown-menu>
                                  </template>
                                </el-dropdown>
                              </el-dropdown-item> -->
                            </el-dropdown-menu>
                          </template>
                        </el-dropdown>
                    </p>
                    <!-- <p>73MB</p> -->
                  </div>
                </div>
                <div class="item-content">
                  {{item.prod.remark}}
                </div>
                <div class="tag">
                  <el-tag class="tag-item" type="info">{{item.prod.typeName}}</el-tag>
                </div>
                <div class="time">创建于 {{ item.prod.createTime }}</div>
              </div>
            </div>
          </template>
        </DiyTable>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import {
  onMounted,
  reactive,
  ref
} from "vue";
import NavList from './components/navList.vue'
import {docsCtrl,userCtrl,INullSpeciesItem, XAttribute} from '@/ts/coreIndex';
import { result } from "lodash";


const diyTable = ref(null);
// 表格展示数据
const pageStore = reactive({
  tableData: [],
  currentPage: 1,
  pageSize: 20,
  total: 0,
});

const options = ref<any>({
  checkBox: false,
  order: true,
  selectLimit: 1,
  noPage:false,
  switchType:true,
  defaultSort: { prop: "createTime", order: "descending" },
  treeProps: {
    children: "children",
    hasChildren: "hasChildren",
  },
});

const state = reactive({
  thingList:[], //实际显示的应用列表
  current:[],
  tableHead: [],
  navData:[],
  checkData:[]
});

const handleUpdate = (page: any) => {
  pageStore.currentPage = page.current;
  pageStore.pageSize = page.pageSize;
};

// 打开文件
const clickFile = async (item:INullSpeciesItem) => {
  state.checkData.push(item)
  loadAttrs(state.checkData)
}

const getSortedList = (
  speciesArray: INullSpeciesItem[],
  array: any[],
  front: boolean,
): any[] => {
  for (let species of speciesArray) {
    if (!array.includes(species)) {
      //没有就放在最前面 改为父级放前，子级放后
      if (front) {
        array = [species, ...array];
      } else {
        array = [...array, species];
      }
    }
    if (species.parent) {
      array = getSortedList([species.parent], array, true);
    }
  }
  return array;
};

const loadAttrs = async (speciesArray: INullSpeciesItem[]) => {
  let parentHeaders: any[] = [];
  let speciesIds = speciesArray.map((item) => item.id);
  //带属性的分类
  let instances = docsCtrl.checkedSpeciesList.filter((item: INullSpeciesItem) =>
    speciesIds.includes(item.id),
  );
  //属性set
  let attrArray: XAttribute[] = [];
  for (let instance of instances) {
    for (let attr of instance.attrs || []) {
      if (!attrArray.map((item) => item.id).includes(attr.id)) {
        attrArray.push(attr);
      }
    }
  }

  let sortedSpecies = getSortedList(instances, [], false);
  for (let species of sortedSpecies) {
    if (attrArray.map((attr: XAttribute) => attr.speciesId).includes(species.id)) {
      let attrs =
        attrArray?.filter((attr: XAttribute) => attr.speciesId == species.id) || [];
      parentHeaders.push({
        caption: attrs[0].species?.name || species.name,
        children: attrs,
      });
    }
  }
  console.log(parentHeaders)
  // setThingAttrs(parentHeaders);
};

onMounted(() => {
  if(docsCtrl.tabIndex == 1){
    getThingMenus()
  }else{
    getWelMenus()
  }
})

const getThingMenus = async () => {
  const root = await userCtrl.space.loadSpeciesTree();
  const species =
    root && root.children ? root.children.filter((item) => item.name == '物')[0] : null;
  state.navData = species?species.children:[]
  return species? buildSpeciesTree(species)
    : {
        children: [] as string[],
        key: '创建',
        label: '创建',
        itemType: '创建',
        item: userCtrl.space,
        icon: '',
      }
};

/** 获取获取菜单 */
const getWelMenus = async () => {
  const root = await userCtrl.space.loadSpeciesTree();
  const species = root?.children?.filter((item) => item.name == '财')[0];
  state.navData = species?species.children:[]
  return species
    ? buildSpeciesTree(species)
    : {
        children: [] as string[],
        key: '获取',
        label: '获取',
        itemType: '获取',
        item: species,
        icon: '',
      };
};

const buildSpeciesTree = (species: INullSpeciesItem): MenuItemType => {
  const result: MenuItemType = {
    key: species.id,
    item: species,
    label: species.name,
    icon: '',
    itemType: '物',
    // menus: loadSpeciesMenus(species),
    children: species.children?.map((i) => buildSpeciesTree(i)) ?? [],
  };
  return result;
};


// const loadSpeciesAttrs = async (species:INullSpeciesItem) => {
//   let targetAttrs = (await species?.loadAttrs(userCtrl.space.id || '', {
//         offset: 0,
//         limit: 1000,
//         filter: '',
//       }))?.result || [];
//   let arr:any = []
//   if(targetAttrs){
//     targetAttrs?.forEach(element => {
//       let obj = {
//         type: element.valueType,
//         label: element.name,
//         align: "center",
//         width: "100",
//         name: "operate",
//       }
//       arr.push(obj)
//     });
//     arr.push({
//         type: "slot",
//         label: "操作",
//         fixed: "right",
//         align: "center",
//         width: "100",
//         name: "operate",
//     })
//     state.tableHead = arr
//   }
// }
</script>

<style lang="scss" scoped>
.thing{
  display: flex;
  width: 100%;
  height: 100%;
  position: relative;
  .thingMainBox{
    width: 100%;
    height: 100%;
    background-color: #fff;
    position: relative;
    .table{
      width: 100%;
      height: 100%;
    }
  }
  
}
</style>