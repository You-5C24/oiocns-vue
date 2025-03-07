<template>
  <el-dialog
    v-model="show"
    :title="`${ruleForm.id ? '更新' : '新增'}表单`"
    width="668px"
    :close-on-click-modal="false"
    :before-close="handleClose"
  >
    <el-form
      ref="ruleFormRef"
      :model="ruleForm"
      :rules="rules"
      label-position="top"
      status-icon
    >
      <el-row :gutter="20">
        <el-col :span="12">
          <el-form-item label="表单名称" prop="name">
            <el-input
              v-model="ruleForm.name"
              placeholder="请输入"
              clearable
            ></el-input>
          </el-form-item>
        </el-col>
        <el-col :span="12">
          <el-form-item label="业务代码" prop="code">
            <el-input
              v-model="ruleForm.code"
              placeholder="请输入"
              clearable
            ></el-input>
          </el-form-item>
        </el-col>
      </el-row>
      <el-row :gutter="20">
        <el-col :span="12">
          <el-form-item label="选择指定组织" prop="belongId">
            <el-select
              v-model="ruleForm.belongId"
              placeholder="请选择"
              clearable
            >
              <el-option
                v-for="item in belongOptions"
                :key="item.label"
                :label="item.label"
                :value="item.value"
              ></el-option>
            </el-select>
          </el-form-item>
        </el-col>
        <el-col :span="12">
          <el-form-item label="向下级组织公开" prop="public">
            <el-select v-model="ruleForm.public" placeholder="请选择" clearable>
              <el-option
                v-for="item in publicOptions"
                :key="item.label"
                :label="item.label"
                :value="item.value"
              ></el-option>
            </el-select>
          </el-form-item>
        </el-col>
      </el-row>
      <el-row :gutter="20">
        <el-col :span="12">
          <el-form-item label="选择角色" prop="beginAuthId">
            <el-tree-select
              v-model="ruleForm.beginAuthId"
              :data="authorityTree"
              check-strictly
              placeholder="请选择"
              :render-after-expand="false"
              clearable
            >
            </el-tree-select>
          </el-form-item>
        </el-col>
      </el-row>
      <el-form-item>
        <el-button @click="handleClose()">取消</el-button>
        <el-button type="primary" @click="submitForm(ruleFormRef)">
          确定
        </el-button>
      </el-form-item>
    </el-form>
  </el-dialog>
</template>

<script lang="ts">
export default {
  name: "AddForm",
};
</script>

<script setup lang="ts">
import { userCtrl as user } from "@/ts/coreIndex";
import _ from 'lodash'

const publicOptions = [
  { label: "公开", value: true },
  { label: "不公开", value: false },
];
const belongOptions = ref<any>([]);

const show = ref<boolean>(false);
const ruleFormRef = ref(null);
const props = defineProps({
  dialog: Boolean,
  info: Object,
  editFormInfo: Object,
});

const emit = defineEmits([
  "update:dialog",
  "updateTable",
  "update:editFormInfo",
]);

const defaultRemark: any = {
  type: "object",
  properties: {},
  labelWidth: 120,
  displayType: "row",
  column: 2,
  diyForVue: null
};

const ruleForm = ref<any>({
  name: "",
  code: "",
  belongId: "",
  public: "",
  beginAuthId: "",
  remark: JSON.stringify(defaultRemark),
});

const rules = reactive({
  name: [{ required: true, message: "请输入表单名称", trigger: "blur" }],
  code: [{ required: true, message: "请输入业务代码", trigger: "blur" }],
  belongId: [{ required: true, message: "请选择指定组织", trigger: "blur" }],
  beginAuthId: [{ required: true, message: "请选择角色", trigger: "blur" }],
  public: [
    { required: true, message: "请选择是否向下级组织公开", trigger: "blur" },
  ],
});

const submitForm = async (formEl: any) => {
  if (!formEl) return;
  await formEl.validate(async (valid: any) => {
    if (valid) {
      console.log("submit", ruleForm.value);
      await props.info[
        ruleForm.value.id ? "updateOperation" : "createOperation"
      ](ruleForm.value);
      ElMessage.success(`${ruleForm.value.id ? "操作" : "更新"}成功`);
      emit("update:editFormInfo", null);
      emit("updateTable");
      handleClose();
    } else {
      ElMessage.error("请正确填写表单");
    }
  });
};

const handleClose = () => {
  show.value = false;
  setTimeout(() => {
    emit("update:dialog", false);
  }, 500);
};

const getTeamTree = async () => {
  const tempTree = await user.getTeamTree();
  return tempTree.map((item) => {
    return { label: item.teamName, value: item.id };
  });
};


const authorityTree = ref([]);
const getAuthorityTree = async () => {
  const tempTreeItem = await user.space.loadAuthorityTree(false)
  const tempTree = [tempTreeItem]
  const formatTree = (tree: any) => {
    return tree.map((item: any) => {
      return {
        key: item.id,
        label: item.name,
        value: item.id,
        children: item.children && item.children.length ? formatTree(item.children) : []
      }
    })
  }

  authorityTree.value = formatTree(tempTree)

  authorityTree.value.unshift({label: '全员', value: 0, key: 0})
}

onMounted(async () => {
  show.value = props.dialog;
  if (props.editFormInfo) {
    ruleForm.value = _.cloneDeep(props.editFormInfo) ;
  }
  getAuthorityTree()
  belongOptions.value = await getTeamTree();
});
</script>

<style lang="scss" scoped></style>
