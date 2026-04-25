package com.bailwatch;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.context.annotation.Bean;
import org.springframework.http.client.SimpleClientHttpRequestFactory;
import org.springframework.web.client.RestTemplate;

@SpringBootApplication
public class BailwatchApplication {

	public static void main(String[] args) {
		SpringApplication.run(BailwatchApplication.class, args);
	}
	
	// RestTemplate bean with timeouts — prevents Flask hang from freezing Spring threads
	@Bean
	public RestTemplate restTemplate() {
		SimpleClientHttpRequestFactory factory = new SimpleClientHttpRequestFactory();
		factory.setConnectTimeout(10000);   // 3 seconds to establish connection
		factory.setReadTimeout(120000);     // 15 seconds to wait for Flask response
		return new RestTemplate(factory);
	}

}