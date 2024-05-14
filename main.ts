import {Editor, Plugin} from 'obsidian';

// Remember to rename these classes and interfaces!

interface MyPluginSettings {
	mySetting: string;
}
export default class MyPlugin extends Plugin {
	settings: MyPluginSettings;

	async onload() {
		// 处理粘贴的图片的默认大小
		document.addEventListener('paste', function (e){
			PicHandle.analysisPaste(e);
		});
		// =================================
		// 添加指令
		this.addCommand({
			id: '背景色-红',
			name: '背景色-红',
			callback: () => {
				this.changeBackColor(ColorPicker.red);
			}
		});
		this.addCommand({
			id: '背景色-黄',
			name: '背景色-黄',
			callback: () => {
				this.changeBackColor(ColorPicker.yellow);
			}
		});
		this.addCommand({
			id: '背景色-紫',
			name: '背景色-紫',
			callback: () => {
				this.changeBackColor(ColorPicker.purple);
			}
		});
		this.addCommand({
			id: '背景色-绿',
			name: '背景色-绿',
			callback: () => {
				this.changeBackColor(ColorPicker.green);
			}
		});
		this.addCommand({
			id: '添加标志-星星',
			name: '添加标志-星星',
			callback: () => {
				this.addStar();
			}
		});
	}

	changeBackColor(color: ColorPicker){
		// 获取编辑区
		const editor = app.workspace.activeEditor?.editor
		if(editor === undefined) return;
		// 获取所选的行号
		const startLine = editor?.getCursor("from").line;
		const endLine = editor?.getCursor("to").line;
		// 如果没有激活这个区域就是undefined
		if((startLine === undefined) || (endLine === undefined)) return;
		// 获取所有的行数，形成待操作数组
		const chooseList = [];
		let count = startLine;
		while (count <= endLine){
			chooseList.push(count);
			count++;
		}
		// 开始遍历这些数组，并且进行操作
		// 有两种可能：
		// 1.所有行都已满足，则将所有行的背景色清空
		// 2.有任何一行没有满足，则将没有满足的行背景染色

		// 首先判断：是否均满足,以至于需要清空
		let needClearMark = true
		for(const i of chooseList){
			const res = BackgroundHandle.checkBackColorSame(editor,i,color);
			if(!res) needClearMark = false;
		}
		// 全都一样，开始清除所有的样式
		if (needClearMark){
			for(const i of chooseList){
				BackgroundHandle.cleanBackColor(editor,i);
			}
		}
		// 有哪怕一个不一样，开始统一样式
		if (!needClearMark){
			for(const i of chooseList){
				BackgroundHandle.changeRowBackColor(editor,i,color);
			}
		}
	}

	// 在行列最前面添加星星
	addStar(){
		// 跟上面背景的处理方式基本上是一样的
		const editor = app.workspace.activeEditor?.editor
		if(editor === undefined) return;
		// 获取所选的行号
		const startLine = editor?.getCursor("from").line;
		const endLine = editor?.getCursor("to").line;
		// 如果没有激活这个区域就是undefined
		if((startLine === undefined) || (endLine === undefined)) return;
		// 获取所有的行数，形成待操作数组
		const chooseList = [];
		let count = startLine;
		while (count <= endLine){
			chooseList.push(count);
			count++;
		}
		// 首先判断：是否均满足,以至于需要清空
		let needClearMark = true
		for(const i of chooseList){
			const res = StarHandle.checkExistStar(editor,i);
			if(!res) needClearMark = false;
		}
		// 全都一样，开始清除所有的样式
		if (needClearMark){
			for(const i of chooseList){
				StarHandle.removeExistStar(editor,i);
			}
		}
		// 有哪怕一个不一样，开始统一样式
		if (!needClearMark){
			// 存在的话就不处理了
			for(const i of chooseList){
				if(!StarHandle.checkExistStar(editor,i)){
					StarHandle.addNewStar(editor,i);
				}
			}
		}
	}

	onunload() {
	}
}

// 用于快速挑选颜色的枚举
enum ColorPicker{
	yellow = "#fff88f",
	green = "#affad1",
	red = "#ff4d4f",
	purple = "#d2cbff"
}

// 常用的正则方法封装
class RegExpFactory{
	// 1.输入颜色，匹配该背景颜色代码是否存在于该行
	static findBackColorInLine(lineText:string, color:ColorPicker) :boolean{
		const reg = new RegExp(`<span style="background:${color}">`)
		return reg.test(lineText)
	}

	// 2.该行是否有background属性
	static checkBackground(lineText:string) :boolean{
		const reg = new RegExp(`style="background:`);
		return reg.test(lineText);
	}

	// 3.用新的颜色去替换background属性，当然，其实是返回当行的字符串
	static changeBackground(lineText:string, color:ColorPicker) :string{
		const regString = 'style="background:#\\w{6}';
		const reg = new RegExp(regString);
		const colorString = `style="background:${color}`
		return lineText.replace(reg, colorString)
	}

	// 4.添加新颜色的background
	static addBackground(lineText:string, color:ColorPicker) :string{
		return `<span style="background:${color}">` + lineText + "</span>";
	}

	// 5.去除背景颜色标签
	static removeBackground(lineText:string ) :string{
		// 先剔除前面
		let regString = '<span style="background:#\\w{6}">';
		let reg = new RegExp(regString);
		const resRemoveBefore = lineText.replace(reg, "");
		// 再剔除后面
		regString = `</span>`;
		reg = new RegExp(regString);
		return resRemoveBefore.replace(reg, "")
	}

	// 6.去除星星
	static removeStar(lineText:string ) :string{
		const regString = `<font color="#c00000">★ </font>`;
		const reg = new RegExp(regString);
		return lineText.replace(reg, "")
	}

	// 7.是否已存在星星
	static checkStar(lineText:string ) :boolean{
		const reg = new RegExp(`<font color="#c00000">★ </font>`);
		return reg.test(lineText);
	}

	// 8.添加星星
	static addStar(lineText:string ) :string{
		// 两种可能：存在背景色/不存在。
		if(RegExpFactory.checkBackground(lineText)){
			// 前面背景部分的正则
			const regString = '<span style="background:#\\w{6}">';
			const reg = new RegExp(regString);
			// 先把前面的内容在剔除前保留住
			const beforeBackStringList = lineText.match(reg);
			if(beforeBackStringList === null) return lineText;
			const beforeBackString = beforeBackStringList[0];
			// 先剔除前面
			const resRemoveBefore = lineText.replace(reg, "");
			return beforeBackString + `<font color="#c00000">★ </font>` + resRemoveBefore;
		}else {
			return `<font color="#c00000">★ </font>` + lineText;
		}
	}

}

// 关于标记添加的方法
class StarHandle{
	// 确认是否存在星星
	static checkExistStar(editor: Editor,line: number):boolean{
		return RegExpFactory.checkStar(editor.getLine(line));
	}

	// 删除星星
	static removeExistStar(editor: Editor,line: number){
		const res = RegExpFactory.removeStar(editor.getLine(line))
		editor.setLine(line,res)
	}

	// 添加星星
	static addNewStar(editor: Editor,line: number){
		const res = RegExpFactory.addStar(editor.getLine(line))
		editor.setLine(line,res)
	}
}



// 在调整背景时使用到的方法
class BackgroundHandle{
	// 对于本行内容，当前是否符合某种颜色的背景
	static checkBackColorSame(editor: Editor,line: number,color: ColorPicker):boolean{
		return RegExpFactory.findBackColorInLine(editor.getLine(line), color)
	}

	// 将本行清空
	static cleanBackColor(editor: Editor,line: number){
		const res = RegExpFactory.removeBackground(editor.getLine(line))
		editor.setLine(line,res)
	}

	// 将本行的颜色变成目标颜色，不管本身有没有这个属性
	static changeRowBackColor(editor: Editor,line: number,color: ColorPicker){
		// 如果有，要更改;如果没有的话，要添加。
		if(RegExpFactory.checkBackground(editor.getLine(line))){
			const res = RegExpFactory.changeBackground(editor.getLine(line),color);
			editor.setLine(line,res)
		}else {
			const res = RegExpFactory.addBackground(editor.getLine(line),color);
			editor.setLine(line,res)
		}

	}
}

// 处理图片的方法
class PicHandle{
	static analysisPaste(e:ClipboardEvent){
		const dataTransferItemList = e.clipboardData?.items;
		// 值为空的话返回，不是图片的话也返回
		if (dataTransferItemList === undefined) return;
		if(dataTransferItemList[0].type.indexOf('image') === -1) return;
		// 变成图片文件，才能获取长和宽
		const blob = dataTransferItemList[0].getAsFile();
		const reader = new FileReader();
		if (blob === null) return;
		reader.readAsDataURL(blob);
		reader.onload = function (evt) {
			const replaceSrc = evt.target?.result;
			const imageObj = new Image();
			imageObj.src = replaceSrc as string;
			imageObj.onload = function () {
				// 终于获取了高和宽，我这里只要宽，如果小于500就不调整
				console.log(imageObj.width);
				if (imageObj.width < 500) return;
				// 需要异步，否则图片还没进来
				setTimeout(()=>{
					// 否则调整到500
					const editor = app.workspace.activeEditor?.editor
					const lineNum = editor?.getCursor().line;
					if (lineNum === undefined) return;
					const textValue = editor?.getLine(lineNum);
					const resText = textValue?.slice(0, -2) + "|500]]";
					editor?.setLine(lineNum, resText)
				},50)
			};
		};
	}
}
