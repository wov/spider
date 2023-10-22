//
//  spiderpocketApp.swift
//  spiderpocket
//
//  Created by wov on 2023/6/3.
//

import SwiftUI
import GoogleMobileAds


class AppDelegate:NSObject,UIApplicationDelegate{
    func application(_ application: UIApplication, didFinishLaunchingWithOptions launchOptions: [UIApplication.LaunchOptionsKey: Any]?) -> Bool {
        // Initialize Google Mobile Ads SDK
        GADMobileAds.sharedInstance().start(completionHandler: nil)
        return true
    }
}


@main
struct spiderpocketApp: App {
    init() {
        let url = URL(string: "http://localhost")!
        let config = URLSessionConfiguration.ephemeral
        config.waitsForConnectivity = true
        let session = URLSession(configuration: config)
        let task = session.dataTask(with: url) { (data, response, error) in
            // Handle Response Here
        }
        task.resume()
    }

    var body: some Scene {
        WindowGroup {
            ContentView()
        }
    }
}


