import SwiftUI
import WebKit

struct ContentView: View {
    var body: some View {
            ZStack {
                Color(red: 105/255, green: 174/255, blue: 107/255)
                    .edgesIgnoringSafeArea(.all)

                WebView()
                    .frame(maxWidth: .infinity, maxHeight: .infinity)
//                    .edgesIgnoringSafeArea(.all) // 忽略安全区域的边缘
            }
        }
}

struct WebView: UIViewRepresentable {
    
    private var webView: WKWebView?

    
    
    func makeUIView(context: Context) -> WKWebView {
        let configuration = configureWebView()
        let webView = WKWebView(frame: .zero, configuration: configuration)
        
        webView.backgroundColor = .clear // 设置背景为透明色

        webView.navigationDelegate = context.coordinator // 设置导航代理
        context.coordinator.webView = webView // 将 WKWebView 实例存储到协调器中

        
        if let url = Bundle.main.url(forResource: "index", withExtension: "html") {
            let baseURL = url.deletingLastPathComponent()
            webView.loadFileURL(url, allowingReadAccessTo: baseURL)
        }
        
        webView.navigationDelegate = context.coordinator // 设置导航代理
        
        // 注册消息处理器
        webView.configuration.userContentController.add(context.coordinator, name: "messageHandler")
        webView.configuration.userContentController.add(context.coordinator, name: "restartGame") // 添加 restartGame 的消息处理器
        
        context.coordinator.webView = webView // 将 WKWebView 实例存储到协调器中
        return webView
    }
    
    private func configureWebView() -> WKWebViewConfiguration {
        let configuration = WKWebViewConfiguration()
        let userScript = WKUserScript(source: "import { initApp } from './script/main.js'; window.initApp = initApp;", injectionTime: .atDocumentEnd, forMainFrameOnly: true)
        configuration.userContentController.addUserScript(userScript)
        return configuration
    }
    
    func updateUIView(_ uiView: WKWebView, context: Context) {
        // No update needed
    }
    
    func makeCoordinator() -> Coordinator {
        Coordinator()
    }

    
    class Coordinator: NSObject, WKUIDelegate, WKNavigationDelegate, WKScriptMessageHandler {
        var webView: WKWebView? // 将 WKWebView 声明为可选类型

        // 处理 JavaScript 弹框
        func webView(_ webView: WKWebView, runJavaScriptAlertPanelWithMessage message: String, initiatedByFrame frame: WKFrameInfo, completionHandler: @escaping () -> Void) {
            guard let windowScene = UIApplication.shared.connectedScenes.first as? UIWindowScene,
                  let rootViewController = windowScene.windows.first?.rootViewController else {
                completionHandler()
                return
            }
            
            let alertController = UIAlertController(title: nil, message: message, preferredStyle: .alert)
            alertController.addAction(UIAlertAction(title: "OK", style: .default) { _ in
                completionHandler()
            })
            
            rootViewController.present(alertController, animated: true, completion: nil)
        }
        
        func webView(_ webView: WKWebView, didFinish navigation: WKNavigation!) {
            print("Web view finished loading")
            // 执行其他操作或检查 JavaScript 代码是否执行
        }
        
        // 接收来自 JavaScript 的消息
        func userContentController(_ userContentController: WKUserContentController, didReceive message: WKScriptMessage) {
            
            
            print("rescive a message from javascript")
            if message.name == "messageHandler" {
                // 处理消息
                if let messageBody = message.body as? String {
                    if messageBody == "showAlert" {
                        print("show alert???")
                        // 显示弹窗
                        showAlert()
                    }
                }
            } else if message.name == "restartGame" {
                print("start a new game????")
                restartGame()
            }
        }
        
        // 显示弹窗
        func showAlert() {
            guard let windowScene = UIApplication.shared.connectedScenes.first as? UIWindowScene,
                  let rootViewController = windowScene.windows.first?.rootViewController else {
                return
            }
            
            let alertController = UIAlertController(title: "Alert", message: "Alert from JavaScript", preferredStyle: .alert)
            alertController.addAction(UIAlertAction(title: "OK", style: .default))
            rootViewController.present(alertController, animated: true, completion: nil)
        }
        
        // 重新开始游戏
        func restartGame() {
            guard let windowScene = UIApplication.shared.connectedScenes.first as? UIWindowScene,
                  let rootViewController = windowScene.windows.first?.rootViewController else {
                return
            }

            let alertController = UIAlertController(title: "Restart Game", message: "Are you sure you want to restart the game?", preferredStyle: .alert)
            alertController.addAction(UIAlertAction(title: "Cancel", style: .cancel))
            alertController.addAction(UIAlertAction(title: "Restart", style: .destructive) { _ in
                // 用户确认重启游戏
                self.performRestart()
            })

            rootViewController.present(alertController, animated: true, completion: nil)
        }

        func performRestart() {
            guard let webView = self.webView else { return }

            let restartScript = """
            (function() {
                localStorage.removeItem("gameState");
                location.reload();
            })();
            """

            webView.evaluateJavaScript(restartScript, completionHandler: nil)
        }


    }
}
