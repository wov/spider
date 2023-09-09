//
//  spiderpocketApp.swift
//  spiderpocket
//
//  Created by wov on 2023/6/3.
//

import SwiftUI
import GoogleMobileAds


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


