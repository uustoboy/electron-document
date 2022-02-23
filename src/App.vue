<script setup>
  const path = require('path');
  const fs = require("fs");
  const cheerio = require('cheerio');
  const Store = require('electron-store');
  import { ref, reactive, onMounted, watch } from 'vue'
  const isDev = process.env.IS_DEV == "true" ? true : false;
  import MessageApi from "./components/message-api.vue";
  import { SettingsOutline,CreateOutline,Close,RemoveOutline } from '@vicons/ionicons5'
  import { NButton, NCard, NTabs, NTabPane, NModal, NFormItem, NUpload,NInput,NSpace,NInputGroup,NMessageProvider,NIcon  } from 'naive-ui'
  import Codemirror from "codemirror-editor-vue3";
  import hljs from 'highlight.js'
  import E from 'wangeditor'
  import 'highlight.js/styles/gml.css'
  import defaultOptions from './tool/options.js'
  import $ from "jquery";
  // language
  import "codemirror/mode/javascript/javascript.js";

  // theme
  import "codemirror/theme/dracula.css";

  const store = new Store();
  const ipcRenderer = require("electron").ipcRenderer;
  let code = ref('')
  let getStoreUrl = store.get('setUrl') || '';
  let setUrl = ref(getStoreUrl);
  let showModal = ref(false);
  const timeoutRef = ref(2000);
  let showModalSelect = ref(false);
  let createHtmlPath = path.join(setUrl.value,'Document.html');
  let modalContent = ref('');
  let cmOptions = reactive({
        mode: "text/html", // Language mode
        theme: "dracula", // Theme
        lineNumbers: true, // Show line number
        smartIndent: true, // Smart indent
        indentUnit: 2, // The smart indent unit is 2 spaces in length
        foldGutter: true, // Code folding
        styleActiveLine: true, // Display the style of the selected row
        lineWrapping: true
      });

  let content = ref('')
  let e = null
  const selfContent = ref('')

  let winWidth = $(window).width();
  let winHeight = $(window).height();

  let codemirrorHeight = ref(winHeight-41-20-35-50);
  
  let h5Html = '';
  
  let h5Url = ref('');
  if (isDev) {
    h5Url.value = path.join('./extraResources/index.html');
  }else{
    h5Url.value = path.join(process.cwd(), '/resources/extraResources','index.html');
  }
  let $C = '';
  fs.readFile(h5Url.value,(err,data)=>{
    if (err) throw err;
    h5Html = data;
    $C = cheerio.load(h5Html);
  })
  //富文本编辑器初始化
  const init = () => {
    e = new E('#wangeditor')
    const selfConfig = Object.assign({}, e.config, defaultOptions)
    if (e) {
      e.highlight = hljs
      e.config = {
        ...selfConfig
      }
      e.config.height =  winHeight-41-20-35-123;
      e.config.onchange = html => {
        const text = e.txt.text()
        const editor = e
        if (html === '<p><br></p>') html = ''
        selfContent.value = html;
      }
      e.config.onblur = html => {
          const text = e.txt.text();
          const editor = e;
          $C('.main').html(html);
          fs.writeFile(h5Url.value, $C.html(), err => {
            if(err){
              throw err;
              return ;
            }
            document.getElementById('iframe1').src = 'http://localhost:8888';
          })

          let js_source = $C.html().replace(/^\s+/, '');
          let tabsize = '4';
          let tabchar = ' ';
          if (tabsize == 1) {
              tabchar = '\t';
          }
          var regEmptyTag = /(<([^\/][^>|^\/>].*)>)(\s*)?(<\/([^>]*)>)/g;
          var c = "";
          c = style_html(js_source, tabsize, tabchar);
          content.value =  c;
          setTimeout(function() {
              document.getElementById( 'codemirrorRefss' ).focus();
              document.getElementById( 'codemirrorRefss' ).click();
          },100);
        }

        e.config.onfocus = html => {
          const text = e.txt.text()
          const editor = e
        }
        e.create()
    }
  }
  
  onMounted(() => {
    init();

  })

  //创建H5 html;
  let createH5Html = ()=>{
    if(!setUrl.value){
      window.$message.error('请你先设置存放路径~')
    }else{
      fs.exists(createHtmlPath, (exists) => {
          if (exists) {
            showModalSelect.value = true;
          } else {
            createStaticHtml(createHtmlPath);
          }
      });
    }
  }

  let submitCallback = ()=>{
    createStaticHtml(createHtmlPath);
  }

  let createStaticHtml = ()=>{
    showModal.value = true;
    modalContent.value = '生成中';
    fs.writeFile(createHtmlPath,$C.html(),(err)=>{
        if(err) {
            return console.log(err);
        }
        modalContent.value = '生成成功！';
        countdown();
    });
  }

  //弹层倒计时;
  const countdown = () => {
      if (timeoutRef.value <= 0) {
        showModal.value = false;
        timeoutRef.value = 2000;
      } else {
        timeoutRef.value -= 1000;
        setTimeout(countdown, 1000);
      }
    }

  //设置路径
  let getFile = (e)=>{
    ipcRenderer.send('open-file-dialog')
  }

  //回传设置路径
  ipcRenderer.on('select-file', (event, arg) => {
    if(arg.length>0){
      setUrl.value = arg[0];
      store.set('setUrl', arg[0]);
      createHtmlPath = path.join(setUrl.value,'Document.html');
    }
  })

  //模拟关闭事件
  let closeWin = (e)=> {
    ipcRenderer.send('close-win');
  }
  
  //模拟缩小事件
  let minWin = (e)=> {
    ipcRenderer.send('min-win');
  }

</script>
  
<template>
  <div class="nav">
    <div class="nav-set">
      <n-icon color="#fff" :component="RemoveOutline" size="20" :depth="1" @click.stop="minWin"/>
      <n-icon color="#fff" :component="Close" size="20" :depth="1" @click.stop="closeWin" />
    </div>
    <div class="nav-title">
      Docuemnt
      <span class="nav-subTitle">一键生成H5文档页</span>
    </div>
  </div>
   <n-card :bordered="false">
    <n-tabs type="line" default-value="first" >
      <n-tab-pane name="first" tab="输入文本" display-directive="show">
        <div>
          <div class="wangeditor">
            <div id="wangeditor"></div>
          </div>
        </div>
      </n-tab-pane>
      <n-tab-pane tab="页面展示" name="second" display-directive="show" >
        <div class="iframe-wrap">
           <div class="iframe-main">
             <iframe width="100%" height="100%"  frameborder="no" border="0" id="iframe1"  src="http://localhost:8888" ></iframe>
           </div>
        </div>
        <n-space vertical>
          <n-input-group>
            <n-input :disabled="true" :style="{ width: '33%' }" v-model:value="setUrl" type="text" placeholder="请输入存放路径" />
            <n-button type="info" @click="getFile">
              <template #icon>
                <n-icon color="#fff" :component="SettingsOutline" size="20" :depth="1" />
              </template>
              设置路径
            </n-button>
            <n-button type="primary"   @click="createH5Html">
              <template #icon>
                <n-icon color="#fff" :component="CreateOutline" size="20" :depth="1" />
              </template>
              一键生成页面
            </n-button>
          </n-input-group>
        </n-space>
      </n-tab-pane>
      <n-tab-pane tab="代码展示" name="third" display-directive="show">
        <Codemirror
            id="codemirrorRefss"
            v-model:value="content"
            :options="cmOptions"
            :height="codemirrorHeight"
            border
            placeholder="test placeholder"
          />
      </n-tab-pane>
    </n-tabs>
  </n-card>

   <!-- 提示  -->
  <n-message-provider>
    <MessageApi />
  </n-message-provider>

  <n-modal v-model:show="showModal" transform-origin="center">
    <n-card
      style="width: 200px;text-align: center;"
      :bordered="false"
      size="huge"
      role="dialog"
      aria-modal="true"
      :mask-closable="false"
    >
      {{modalContent}}
    </n-card>
  </n-modal>
  
  <n-modal
    v-model:show="showModalSelect"
    preset="dialog"
    title="已有文件是否替换"
    content="你确认?"
    positive-text="确认"
    @positive-click="submitCallback"
    negative-text="算了"
  />

</template>
<style lang="scss">
@import './app.scss';
</style>
