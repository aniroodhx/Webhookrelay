package com.anirudh.webhookrelay.repository;

import com.anirudh.webhookrelay.model.DeliveryAttempt;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import java.time.Instant;
import java.util.List;
import java.util.UUID;

public interface DeliveryAttemptRepository extends JpaRepository<DeliveryAttempt, UUID> {

    // Picks up anything PENDING whose next scheduled retry time has arrived.
    // This is the query the retry worker polls on each scheduled tick.
    //
    // event/subscription are fetched eagerly here (rather than left LAZY) because
    // dispatch() runs on an @Async thread with no Hibernate session open — without
    // this, accessing attempt.getEvent().getPayload() there throws
    // LazyInitializationException and every delivery silently fails.
    @Query("SELECT d FROM DeliveryAttempt d " +
           "JOIN FETCH d.event " +
           "JOIN FETCH d.subscription " +
           "WHERE d.status = 'PENDING' AND d.nextAttemptAt <= :now")
    List<DeliveryAttempt> findDueForDelivery(@Param("now") Instant now);
}
