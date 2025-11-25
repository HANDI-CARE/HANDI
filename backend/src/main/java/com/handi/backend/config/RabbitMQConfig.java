package com.handi.backend.config;

import org.springframework.amqp.core.Binding;
import org.springframework.amqp.core.BindingBuilder;
import org.springframework.amqp.core.DirectExchange;
import org.springframework.amqp.core.Queue;
import org.springframework.amqp.rabbit.connection.ConnectionFactory;
import org.springframework.amqp.rabbit.core.RabbitTemplate;
import org.springframework.amqp.support.converter.Jackson2JsonMessageConverter;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration
public class RabbitMQConfig {

    @Value("${spring.rabbitmq.exchange.name}")
    private String exchangeName;

    @Value("${spring.rabbitmq.queue.name}")
    private String queueName;

    @Value("${spring.rabbitmq.routing.key}")
    private String routingKey;

    @Bean
    public DirectExchange exchange() {
        return new DirectExchange(exchangeName);
    }

    @Bean
    public Queue handiQueue() {
        return new Queue(queueName, true);
    }

    @Bean
    public Binding handiBinding(Queue handiQueue, DirectExchange exchange) {
        return BindingBuilder.bind(handiQueue).to(exchange).with(routingKey);
    }

    public String getExchangeName() {
        return exchangeName;
    }

    public String getQueueName() {
        return queueName;
    }

    public String getRoutingKey() {
        return routingKey;
    }

    @Bean
    public RabbitTemplate rabbitTemplate(ConnectionFactory connectionFactory) {
        RabbitTemplate rabbitTemplate = new RabbitTemplate(connectionFactory);
        rabbitTemplate.setMessageConverter(new Jackson2JsonMessageConverter());
        return rabbitTemplate;
    }
}